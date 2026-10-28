import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';

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
    // 숫자 범위의 물결표(0.21~0.25)가 취소선으로 바뀌지 않게, 취소선은 ~~두 개~~ 일 때만 씁니다.
    gfm: false,
    remarkPlugins: [[remarkGfm, { singleTilde: false }]],
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
