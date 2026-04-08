import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart' show Share, XFile;
import 'package:webview_flutter/webview_flutter.dart';

const String _adUnitId = 'ca-app-pub-4150729063109368/8892235156';

const String _appUrl = String.fromEnvironment(
  'APP_URL',
  defaultValue: 'https://sqlquest.com.br',
);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await MobileAds.instance.initialize();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.transparent,
    ),
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SQLQuest',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF7C3AED)),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

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
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 SQLQuestApp/1.0',
      )
      ..addJavaScriptChannel(
        'AdMobBridge',
        onMessageReceived: (JavaScriptMessage message) {
          if (message.message == 'showAd') {
            _showRewardedAd();
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
          onPageFinished: (_) {
            if (mounted) {
              setState(() => _isLoading = false);
              // Injeta flag para o JS saber que está rodando dentro do app nativo
              _controller.runJavaScript('window.__sqlquestNativeApp = true;');
            }
          },
          onWebResourceError: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(_appUrl));
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
        // Usa documents dir (coberto pelo FileProvider do share_plus)
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

  void _loadRewardedAd() {
    RewardedAd.load(
      adUnitId: _adUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          if (mounted) setState(() => _rewardedAd = ad);
        },
        onAdFailedToLoad: (error) {
          if (mounted) setState(() => _rewardedAd = null);
        },
      ),
    );
  }

  void _showRewardedAd() {
    if (_rewardedAd == null) {
      // Sem anúncio disponível — libera o usuário sem recompensar
      _controller.runJavaScript("window.onAdMobResult('dismissed')");
      _loadRewardedAd();
      return;
    }

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
        // Se o usuário fechou sem ganhar recompensa (não deveria acontecer
        // em rewarded, mas cobre o caso de fechar antes do fim)
        _controller.runJavaScript("window.onAdMobResult('dismissed')");
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _rewardedAd = null;
        _loadRewardedAd();
        _controller.runJavaScript("window.onAdMobResult('dismissed')");
      },
    );

    _rewardedAd!.show(
      onUserEarnedReward: (_, reward) {
        _controller.runJavaScript("window.onAdMobResult('completed')");
      },
    );
    _rewardedAd = null;
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _rewardedAd?.dispose();
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
          bottom: false,
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
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
          ),
        ),
      ),
    );
  }
}
