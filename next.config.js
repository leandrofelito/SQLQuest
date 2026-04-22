const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/sql-wasm\.wasm/,
      handler: 'CacheFirst',
      options: { cacheName: 'wasm', expiration: { maxEntries: 1, maxAgeSeconds: 30 * 24 * 60 * 60 } },
    },
    {
      urlPattern: /\/api\/trilhas(\?.*)?$/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-trilhas', networkTimeoutSeconds: 4, expiration: { maxEntries: 5, maxAgeSeconds: 5 * 60 } },
    },
    {
      urlPattern: /\/api\/etapa\?.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-etapas', networkTimeoutSeconds: 4, expiration: { maxEntries: 100, maxAgeSeconds: 10 * 60 } },
    },
    {
      urlPattern: /\/api\/trilha-dashboard\?.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-trilha-dashboard', networkTimeoutSeconds: 4, expiration: { maxEntries: 30, maxAgeSeconds: 2 * 60 } },
    },
  ],
})

/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  // Garante que o arquivo WASM esteja disponível no bundle serverless da rota de validação
  experimental: {
    outputFileTracingIncludes: {
      '/api/validar-query': ['./public/sql-wasm.wasm'],
    },
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
  async headers() {
    return [
      {
        // Aplica a todas as rotas
        source: '/(.*)',
        headers: [
          // Impede que o site seja embutido em iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o browser "adivinhe" o content-type (MIME sniffing)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla quais informações de referência são enviadas
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desabilita funcionalidades do browser que o app não usa
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS por 1 ano (só entra em efeito em produção com HTTPS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        // Headers específicos para rotas de API
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

module.exports = withPWA(config)
