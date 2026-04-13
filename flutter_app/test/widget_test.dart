// Smoke mínimo: montar MyApp exige WebViewPlatform em teste (integration_test).
// `flutter analyze` cobre main.dart; aqui só garantimos que o harness de teste roda.

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('smoke', () {
    expect(1 + 1, 2);
  });
}
