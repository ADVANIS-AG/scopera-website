import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://advanis-ag.github.io',
  base: '/kurzerhand.ch/',
  integrations: [sitemap()],
});
