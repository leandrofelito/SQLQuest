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
  ],
})

/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
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
}

module.exports = withPWA(config)
