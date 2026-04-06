import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
  ));
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

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
          onWebResourceError: (_) {
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse('https://sqlquest.com.br'));
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
        backgroundColor: const Color(0xFF0F172A),
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_isLoading)
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SvgPicture.asset(
                        'assets/sqlquest_logo_escrita.svg',
                        width: MediaQuery.of(context).size.width * 0.55,
                        fit: BoxFit.contain,
                      ),
                      const SizedBox(height: 32),
                      const CircularProgressIndicator(
                        color: Color(0xFF7C3AED),
                        strokeWidth: 3,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
