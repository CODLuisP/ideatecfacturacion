import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/factufly/', '/api/'], // Evitar que el panel interno y las APIs sean indexadas
    },
    sitemap: 'https://factufly.pe/sitemap.xml',
  };
}
