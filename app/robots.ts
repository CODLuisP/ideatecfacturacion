import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/factunet/', '/api/'], // Evitar que el panel interno y las APIs sean indexadas
    },
    sitemap: 'https://factunet.pe/sitemap.xml',
  };
}
