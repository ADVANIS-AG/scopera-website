import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://scopera.ai',
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
