import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

const site = process.env.SITE ?? 'https://blog.rlarbdlf222.workers.dev';

export default defineConfig({
  site,
  trailingSlash: 'always',
  output: 'static',
  integrations: [mdx(), sitemap({
    filter: (page) => !/^\/(?:preview|dev)(?:\/|$)/.test(new URL(page).pathname),
  })],
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
