import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Kanonische Domain ist www. GitHub Pages leitet den Apex darauf um, deshalb muessen
  // Canonical-Tags, Sitemap und og:image-URLs ebenfalls auf www zeigen. Sonst verweisen
  // sie auf eine URL, die sofort weiterleitet. Muss mit public/CNAME uebereinstimmen.
  site: 'https://www.scopera.ai',
  base: '/',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'de',
        locales: { de: 'de', en: 'en' },
      },
      filter: (page) => !/\/(de|en)\/packages\/?$/.test(page),
    }),
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
