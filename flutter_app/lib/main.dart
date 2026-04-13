import 'dart:async';
import 'dart:convert';
import 'dart:io';

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

const String _rewardedAdUnitId = 'ca-app-pub-4150729063109368/8892235156';

const String _interstitialAdUnitId = String.fromEnvironment(
  'ADMOB_INTERSTITIAL_ID',
  defaultValue: 'ca-app-pub-4150729063109368/REPLACE_WITH_INTERSTITIAL_ID',
);

const String _bannerAdUnitId = String.fromEnvironment(
  'ADMOB_BANNER_ID',
  defaultValue: 'ca-app-pub-4150729063109368/REPLACE_WITH_BANNER_ID',
);

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
        //   "showRewardedAd"   → RewardedAd (envia completed | dismissed via onAdMobResult)
        //   "showAd"           → alias legado de showRewardedAd
        //   "showInterstitialAd" → InterstitialAd (envia dismissed via onAdMobResult — React avança sempre)
        //   "showBanner"       → BannerAd nativo na base da tela
        //   "hideBanner"       → remove o BannerAd
        'AdMobBridge',
        onMessageReceived: (JavaScriptMessage message) {
          final msg = message.message;
          if (msg == 'showAd' || msg == 'showRewardedAd') {
            _showRewardedAd();
          } else if (msg == 'showInterstitialAd') {
            _showInterstitialAd();
          } else if (msg == 'showBanner') {
            _loadBannerAd();
          } else if (msg == 'hideBanner') {
            _hideBanner();
          }
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
          },
          onPageFinished: (url) async {
            if (mounted) {
              setState(() => _isLoading = false);
              // Define a flag E adiciona a classe de forma atômica para evitar
              // condição de corrida com o useEffect do NativeAppDetector React.
              _controller.runJavaScript(
                'window.__sqlquestNativeApp = true;'
                'document.documentElement.classList.add("native-app");',
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

  // ── Rewarded ──────────────────────────────────────────────────────────────

  void _loadRewardedAd() {
    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
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

  /// Exibe rewarded e envia **apenas um** resultado ao JS por exibição:
  /// - `completed` se o usuário ganhou o prêmio (não envia `dismissed` depois,
  ///   senão o React trata como fechamento e cancela o 2º anúncio / liberação).
  /// - `dismissed` se fechou sem prêmio.
  /// - `failed` se falhou ao carregar ou exibir (React pode cancelar sem liberar trilha).
  void _showRewardedAd() {
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
          _rewardedDismissNotifyTimer = Timer(const Duration(milliseconds: 450), () {
            _rewardedDismissNotifyTimer = null;
            if (!mounted) return;
            if (!rewardEarned) {
              _controller.runJavaScript("window.onAdMobResult('dismissed')");
            }
          });
          _loadRewardedAd();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          debugPrint('[AdMob] Rewarded falhou ao exibir: ${error.message}');
          ad.dispose();
          if (mounted) setState(() => _rewardedAd = null);
          _loadRewardedAd();
          _controller.runJavaScript("window.onAdMobResult('failed')");
        },
      );
      ad.show(
        onUserEarnedReward: (_, _) {
          rewardEarned = true;
          _controller.runJavaScript("window.onAdMobResult('completed')");
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

    // 2º anúncio em sequência: o pré-carregamento pode ainda não ter terminado.
    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          present(ad);
        },
        onAdFailedToLoad: (error) {
          debugPrint('[AdMob] Rewarded falhou ao carregar: ${error.message}');
          _controller.runJavaScript("window.onAdMobResult('failed')");
          _loadRewardedAd();
        },
      ),
    );
  }

  // ── Interstitial ──────────────────────────────────────────────────────────

  void _loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
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

  void _loadBannerAd() {
    if (_showingBanner) return; // já exibindo

    final banner = BannerAd(
      adUnitId: _bannerAdUnitId,
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
