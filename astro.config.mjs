import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

const site = process.env.SITE ?? 'https://blog.rlarbdlf222.workers.dev';

export default defineConfig({
  site,
  output: 'static',
  integrations: [mdx(), sitemap()],
  vite: {
    optimizeDeps: {
      exclude: ['@astrojs/cloudflare/entrypoints/server'],
    },
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },

  adapter: cloudflare(),
});
