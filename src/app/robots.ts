import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/workspace', '/settings', '/api/'] },
    ],
    sitemap: 'https://app.flowmapr.com/sitemap.xml',
  }
}
