import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://scopera.ai',
  base: '/kurzerhand.ch/',
  integrations: [sitemap()],
});
