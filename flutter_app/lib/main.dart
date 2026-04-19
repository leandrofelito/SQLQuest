import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart' show Share, XFile;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';

// ── Unidades AdMob ────────────────────────────────────────────────────────────
// IDs são públicos por natureza (ca-app-pub-…); não são segredos.
// Para interstitial e banner: crie as unidades no console AdMob e passe via
//   --dart-define=ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
//   --dart-define=ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
//
// Banner (release): crie uma unidade "Banner" no console AdMob para o app
// ca-app-pub-4150729063109368~4419072443 e passe o ID via ADMOB_BANNER_ID.
// Em debug usa-se o banner de teste oficial do Google (kDebugMode).

const String _rewardedAdUnitId = 'ca-app-pub-4150729063109368/8892235156';

/// Tempo após o dismiss do rewarded antes de notificar `dismissed` ao JS.
/// Redes mediadas podem disparar `onUserEarnedReward` depois de `onAdDismissedFullScreenContent`.
const Duration _rewardedDismissGrace = Duration(milliseconds: 2000);

const String _interstitialAdUnitId = String.fromEnvironment(
  'ADMOB_INTERSTITIAL_ID',
  defaultValue: 'ca-app-pub-4150729063109368/REPLACE_WITH_INTERSTITIAL_ID',
);

/// IDs de teste oficiais do Google (somente debug). Não usar em release.
const String _googleTestBannerAdUnitId =
    'ca-app-pub-3940256099942544/6300978111';
const String _googleTestInterstitialAdUnitId =
    'ca-app-pub-3940256099942544/1033173712';
const String _googleTestRewardedAdUnitId =
    'ca-app-pub-3940256099942544/5224354917';

const String _bannerAdUnitIdFromEnv = String.fromEnvironment('ADMOB_BANNER_ID');

/// ID efetivo do banner: teste em debug; em release/profile o valor de
/// `--dart-define=ADMOB_BANNER_ID=...` (obrigatório para anúncio real).
String _effectiveBannerAdUnitId() {
  if (kDebugMode) return _googleTestBannerAdUnitId;
  if (_bannerAdUnitIdFromEnv.isNotEmpty) return _bannerAdUnitIdFromEnv;
  return '';
}

/// ID efetivo do interstitial: teste em debug; em release o valor de
/// `--dart-define=ADMOB_INTERSTITIAL_ID=...` (obrigatório para anúncio real).
String _effectiveInterstitialAdUnitId() {
  if (kDebugMode) return _googleTestInterstitialAdUnitId;
  if (_interstitialAdUnitId.contains('REPLACE_WITH')) return '';
  return _interstitialAdUnitId;
}

/// ID efetivo do rewarded: teste em debug; em release o ID hardcoded.
String _effectiveRewardedAdUnitId() {
  if (kDebugMode) return _googleTestRewardedAdUnitId;
  return _rewardedAdUnitId;
}

const String _appUrl = String.fromEnvironment(
  'APP_URL',
  defaultValue: 'https://sqlquest.com.br',
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // AdMob: inicialização nativa independente do WebView / latência do Neon.
  // Não bloquear nem serializar com o carregamento de dados do app web.
  await MobileAds.instance.initialize();

  final prefs = await SharedPreferences.getInstance();
  final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;

  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
    ),
  );
  runApp(MyApp(isLoggedIn: isLoggedIn));
}

class MyApp extends StatelessWidget {
  final bool isLoggedIn;
  const MyApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SQLQuest',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF7C3AED)),
        useMaterial3: true,
      ),
      home: WebViewScreen(isLoggedIn: isLoggedIn),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  final bool isLoggedIn;
  const WebViewScreen({super.key, required this.isLoggedIn});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen>
    with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;
  bool _isLoading = true;

  RewardedAd? _rewardedAd;
  InterstitialAd? _interstitialAd;
  BannerAd? _bannerAd;
  bool _showingBanner = false;

  /// Evita enviar `dismissed` ao JS antes de `onUserEarnedReward` (mediação / bridge).
  Timer? _rewardedDismissNotifyTimer;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    );
    _fadeController.forward();
    _loadRewardedAd();
    _loadInterstitialAd();

    // Se já logado, abre direto na home — evita o flash da tela de login
    final initialUrl =
        widget.isLoggedIn ? '$_appUrl/home' : _appUrl;

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 SQLQuestApp/1.0',
      )
      ..addJavaScriptChannel(
        'SessionBridge',
        onMessageReceived: (JavaScriptMessage message) async {
          final prefs = await SharedPreferences.getInstance();
          if (message.message == 'login') {
            await prefs.setBool('isLoggedIn', true);
          } else if (message.message == 'logout') {
            await prefs.setBool('isLoggedIn', false);
          }
        },
      )
      ..addJavaScriptChannel(
        // Contrato com AnuncioVideo.tsx e AdBanner.tsx:
        //   "showRewardedAd" | "showAd" → RewardedAd
        //   JSON: {"action":"showRewardedAd","requestId":"<uuid>"} (recomendado; ecoa requestId no resultado)
        //   onAdMobResult: string legado OU JSON {"status":"completed|dismissed|failed","requestId":"..."}
        //   "showInterstitialAd" → InterstitialAd (envia dismissed via onAdMobResult — React avança sempre)
        //   "showBanner"       → BannerAd nativo na base da tela
        //   "hideBanner"       → remove o BannerAd
        //   Banner: Flutter chama window.onBannerAdResult('failed') se não houver ID ou load falhar
        'AdMobBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleAdMobBridgeMessage(message.message);
        },
      )
      ..addJavaScriptChannel(
        'CertificadoBridge',
        onMessageReceived: (JavaScriptMessage message) {
          _handleCertificado(message.message);
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
            // Cedo no carregamento: o React/hooks de anúncio nativo dependem disso
            // antes de onPageFinished (evita cair no fluxo AdSense dentro do app).
            _controller.runJavaScript(
              'window.__sqlquestNativeApp = true;'
              'try{document.documentElement.classList.add("native-app");}catch(e){}',
            );
          },
          onPageFinished: (url) async {
            if (mounted) {
              setState(() => _isLoading = false);
              // Reforço idempotente (NativeAppDetector / useNativeAdHost).
              _controller.runJavaScript(
                'window.__sqlquestNativeApp = true;'
                'try{document.documentElement.classList.add("native-app");}catch(e){}',
              );

              // Sessão expirou: o servidor redirecionou para /login
              if (url.contains('/login')) {
                final prefs = await SharedPreferences.getInstance();
                await prefs.setBool('isLoggedIn', false);
              }
            }
          },
          onWebResourceError: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(initialUrl));
  }

  Future<void> _handleCertificado(String message) async {
    try {
      final data = jsonDecode(message) as Map<String, dynamic>;
      final action = data['action'] as String;

      if (action == 'share') {
        final url = data['url'] as String;
        final title = data['title'] as String? ?? 'Certificado SQLQuest';
        await Share.share('$title\n$url', subject: title);
      } else if (action == 'download') {
        final filename = data['filename'] as String;
        final base64Str = data['base64'] as String;
        final bytes = base64Decode(base64Str);
        final dir = await getApplicationDocumentsDirectory();
        final file = File('${dir.path}/$filename');
        await file.writeAsBytes(bytes);
        await Share.shareXFiles(
          [XFile(file.path, mimeType: 'application/pdf')],
          subject: filename,
          text: 'Certificado SQLQuest',
        );
      }
    } catch (e) {
      final msg = e.toString().replaceAll("'", '').replaceAll('"', '');
      _controller.runJavaScript("alert('Erro ao processar certificado: $msg')");
    }
  }

  void _handleAdMobBridgeMessage(String raw) {
    var action = raw;
    String? requestId;
    final trimmed = raw.trimLeft();
    if (trimmed.startsWith('{')) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          final m = Map<String, dynamic>.from(decoded);
          final a = m['action'];
          if (a is String) action = a;
          final r = m['requestId'];
          if (r is String && r.isNotEmpty) requestId = r;
        }
      } catch (_) {
        // mantém action = raw
      }
    }
    if (action == 'showAd' || action == 'showRewardedAd') {
      _showRewardedAd(requestId);
    } else if (action == 'showInterstitialAd') {
      _showInterstitialAd();
    } else if (action == 'showBanner') {
      _loadBannerAd();
    } else if (action == 'hideBanner') {
      _hideBanner();
    }
  }

  /// Notifica o WebView sobre o fim do rewarded (sempre JSON para correlacionar com requestId).
  void _emitRewardedAdResult(String status, String? requestId) {
    final map = <String, dynamic>{'status': status};
    if (requestId != null && requestId.isNotEmpty) {
      map['requestId'] = requestId;
    }
    final inner = jsonEncode(map);
    _controller.runJavaScript('window.onAdMobResult(${jsonEncode(inner)})');
  }

  // ── Rewarded ──────────────────────────────────────────────────────────────

  void _loadRewardedAd() {
    RewardedAd.load(
      adUnitId: _effectiveRewardedAdUnitId(),
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          if (mounted) setState(() => _rewardedAd = ad);
        },
        onAdFailedToLoad: (error) {
          debugPrint('[AdMob] Rewarded falhou ao carregar: ${error.message}');
          if (mounted) setState(() => _rewardedAd = null);
        },
      ),
    );
  }

  /// Exibe rewarded e envia **apenas um** resultado ao JS por exibição (JSON com status + requestId):
  /// - `completed` se o usuário ganhou o prêmio (não envia `dismissed` depois,
  ///   senão o React trata como fechamento e cancela o 2º anúncio / liberação).
  /// - `dismissed` se fechou sem prêmio após [_rewardedDismissGrace].
  /// - `failed` se falhou ao carregar ou exibir (React pode cancelar sem liberar trilha).
  void _showRewardedAd([String? requestId, int retryCount = 0]) {
    void present(RewardedAd ad) {
      _rewardedDismissNotifyTimer?.cancel();
      _rewardedDismissNotifyTimer = null;

      var rewardEarned = false;
      ad.fullScreenContentCallback = FullScreenContentCallback(
        onAdDismissedFullScreenContent: (ad) {
          ad.dispose();
          if (mounted) setState(() => _rewardedAd = null);
          // Adia `dismissed`: se `onUserEarnedReward` vier depois do dismiss (rede
          // mediada / timing WebView), o React não deve fechar o overlay antes do
          // `completed` — senão remove `window.onAdMobResult` e a dica não libera.
          _rewardedDismissNotifyTimer?.cancel();
          _rewardedDismissNotifyTimer = Timer(_rewardedDismissGrace, () {
            _rewardedDismissNotifyTimer = null;
            if (!mounted) return;
            if (!rewardEarned) {
              _emitRewardedAdResult('dismissed', requestId);
            }
          });
          _loadRewardedAd();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          debugPrint('[AdMob] Rewarded falhou ao exibir: ${error.message}');
          ad.dispose();
          if (mounted) setState(() => _rewardedAd = null);
          _loadRewardedAd();
          _emitRewardedAdResult('failed', requestId);
        },
      );
      ad.show(
        onUserEarnedReward: (_, _) {
          rewardEarned = true;
          _emitRewardedAdResult('completed', requestId);
        },
      );
    }

    if (_rewardedAd != null) {
      final ad = _rewardedAd!;
      _rewardedAd = null;
      if (mounted) setState(() {});
      present(ad);
      return;
    }

    // Anúncio ainda não carregado: carrega sob demanda com 1 retry automático.
    RewardedAd.load(
      adUnitId: _effectiveRewardedAdUnitId(),
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          present(ad);
        },
        onAdFailedToLoad: (error) {
          debugPrint('[AdMob] Rewarded falhou ao carregar (tentativa ${retryCount + 1}): ${error.message}');
          if (retryCount < 1) {
            Future.delayed(const Duration(seconds: 3), () {
              if (mounted) _showRewardedAd(requestId, retryCount + 1);
            });
            return;
          }
          _emitRewardedAdResult('failed', requestId);
          _loadRewardedAd();
        },
      ),
    );
  }

  // ── Interstitial ──────────────────────────────────────────────────────────

  void _loadInterstitialAd() {
    final unitId = _effectiveInterstitialAdUnitId();
    if (unitId.isEmpty) {
      debugPrint('[AdMob] Interstitial: defina --dart-define=ADMOB_INTERSTITIAL_ID=ca-app-pub-…/…');
      return;
    }
    InterstitialAd.load(
      adUnitId: unitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          if (mounted) setState(() => _interstitialAd = ad);
        },
        onAdFailedToLoad: (error) {
          debugPrint('[AdMob] Interstitial falhou ao carregar: ${error.message}');
          if (mounted) setState(() => _interstitialAd = null);
        },
      ),
    );
  }

  void _showInterstitialAd() {
    if (_interstitialAd == null) {
      // Sem anúncio disponível: React avança de qualquer forma para interstitial
      _controller.runJavaScript("window.onAdMobResult('dismissed')");
      _loadInterstitialAd();
      return;
    }

    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
        // AnuncioVideo.tsx avança ao receber qualquer resultado para interstitial
        _controller.runJavaScript("window.onAdMobResult('dismissed')");
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('[AdMob] Interstitial falhou ao exibir: ${error.message}');
        ad.dispose();
        _interstitialAd = null;
        _loadInterstitialAd();
        _controller.runJavaScript("window.onAdMobResult('dismissed')");
      },
    );

    _interstitialAd!.show();
    _interstitialAd = null;
  }

  // ── Banner ────────────────────────────────────────────────────────────────

  void _notifyBannerAdResult(String result) {
    final encoded = jsonEncode(result);
    _controller.runJavaScript(
      'try { if (typeof window.onBannerAdResult === "function") window.onBannerAdResult($encoded); } catch (e) {}',
    );
  }

  void _loadBannerAd() {
    if (_showingBanner) return; // já exibindo

    final unitId = _effectiveBannerAdUnitId();
    if (unitId.isEmpty) {
      debugPrint(
        '[AdMob] Banner: em release defina --dart-define=ADMOB_BANNER_ID=ca-app-pub-…/… '
        '(unidade Banner criada no AdMob).',
      );
      _notifyBannerAdResult('failed');
      return;
    }

    final banner = BannerAd(
      adUnitId: unitId,
      size: AdSize.banner, // 320×50 — alinhado ao placeholder de 50px do AdBanner.tsx
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() {
              _bannerAd = ad as BannerAd;
              _showingBanner = true;
            });
          }
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('[AdMob] Banner falhou ao carregar: ${error.message}');
          ad.dispose();
          if (mounted) {
            _notifyBannerAdResult('failed');
          }
        },
      ),
    );
    banner.load();
  }

  void _hideBanner() {
    if (!_showingBanner) return;
    _bannerAd?.dispose();
    if (mounted) {
      setState(() {
        _bannerAd = null;
        _showingBanner = false;
      });
    }
  }

  @override
  void dispose() {
    _rewardedDismissNotifyTimer?.cancel();
    _rewardedDismissNotifyTimer = null;
    _fadeController.dispose();
    _rewardedAd?.dispose();
    _interstitialAd?.dispose();
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) {
          final canGoBack = await _controller.canGoBack();
          if (canGoBack) {
            await _controller.goBack();
          } else {
            SystemNavigator.pop();
          }
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF080a0f),
        body: SafeArea(
          // bottom: false → WebView vai até o fundo da tela (edge-to-edge).
          // O CSS do site usa env(safe-area-inset-bottom) para padding do nav —
          // o Android WebView expõe esse valor corretamente com edgeToEdge ativo.
          bottom: false,
          child: Builder(
            builder: (context) {
              // Inset da barra de navegação do sistema (ex.: ~48 px gestural /
              // ~56 px nos botões de 3 botões). Usado para posicionar o banner
              // nativo acima da barra sem depender de SafeArea.
              final sysBottomPad = MediaQuery.of(context).padding.bottom;

              return Stack(
                children: [
                  // WebView ocupa tudo, exceto os 50 px do banner nativo quando ativo
                  Positioned.fill(
                    bottom: _showingBanner ? 50.0 + sysBottomPad : 0.0,
                    child: WebViewWidget(controller: _controller),
                  ),
                  // Banner nativo AdMob — encaixado acima da barra do sistema
                  if (_showingBanner && _bannerAd != null)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: sysBottomPad,
                      height: 50,
                      child: AdWidget(ad: _bannerAd!),
                    ),
                  if (_isLoading)
                    FadeTransition(
                      opacity: _fadeAnimation,
                      child: Container(
                        color: const Color(0xFF080a0f),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Image.asset(
                                'assets/sqlquest_logo.png',
                                width: MediaQuery.of(context).size.width * 0.58,
                                fit: BoxFit.contain,
                              ),
                              const SizedBox(height: 40),
                              SizedBox(
                                width: 28,
                                height: 28,
                                child: CircularProgressIndicator(
                                  color: const Color(0xFFB8962E),
                                  backgroundColor:
                                      const Color(0xFFB8962E).withAlpha(40),
                                  strokeWidth: 2.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
