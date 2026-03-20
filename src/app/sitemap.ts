import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://app.flowmapr.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://app.flowmapr.com/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://app.flowmapr.com/signup', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://flowmapr.com/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://flowmapr.com/blog/best-ai-diagram-tools-for-business-analysts', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
