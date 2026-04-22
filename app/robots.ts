import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/factunet/', '/api/'], // Evitar que el panel interno y las APIs sean indexadas
    },
    sitemap: 'https://factunet.pe/sitemap.xml',
  };
}
