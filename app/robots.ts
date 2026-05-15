import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/', '/sobre', '/roadmap', '/status', '/privacidade', '/termos', '/cert/'],
        disallow: ['/admin/', '/api/', '/(app)/', '/escolher-nickname', '/upgrade', '/manutencao'],
      },
    ],
    sitemap: 'https://sqlquest.com.br/sitemap.xml',
  }
}
