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
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/overview/introduction' },
          { text: 'Setup', link: '/overview/setup' },
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
