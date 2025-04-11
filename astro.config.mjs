import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://example.com',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    tailwind(),
    preact(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date()
    })
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  image: {
    domains: [],
    remotePatterns: [],
  },
});
