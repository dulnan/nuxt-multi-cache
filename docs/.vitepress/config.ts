import { defineConfig } from 'vitepress'

export default defineConfig({
  base: (process.env.BASE_URL as `/${string}/` | undefined) || '/',
  title: 'Nuxt Multi Cache',
  description: '',
  locales: {
    '/': {
      lang: 'en-US',
    },
  },
  themeConfig: {
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2021-present Jan Hug',
    },
    nav: [
      {
        text: '1.x (for Nuxt 2)',
        link: 'https://nuxt-multi-cache-legacy.dulnan.net',
      },
      { text: 'GitHub', link: 'https://github.com/dulnan/nuxt-multi-cache' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/overview/introduction' },
          { text: 'Configuration', link: '/overview/configuration' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Component Cache', link: '/features/componentCache' },
          { text: 'Route Cache', link: '/features/routeCache' },
          { text: 'Data Cache', link: '/features/dataCache' },
          { text: 'CDN Cache Control', link: '/features/cdnCacheControl' },
          { text: 'Purge API', link: '/features/api' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          {
            text: 'Defining Default Values',
            link: '/advanced/defaultValues',
          },
          {
            text: 'Cache Backend',
            link: '/advanced/cacheBackend',
          },
          {
            text: 'Using Storage Instance',
            link: '/advanced/storageInstance',
          },
          {
            text: 'Using Route Cache + CDN',
            link: '/advanced/routeAndCDN',
          },
          {
            text: 'Enable Caching Conditionally',
            link: '/advanced/enableCacheConditionally',
          },
        ],
      },
    ],
  },
})
