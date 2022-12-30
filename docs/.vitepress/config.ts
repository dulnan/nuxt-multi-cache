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
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/introduction/overview' },
          { text: 'Setup', link: '/introduction/setup' },
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
        text: 'Configuration',
        items: [
          {
            text: 'Module',
            link: '/configuration/module',
          },
          {
            text: 'Full Example',
            link: '/configuration/full-example',
          },
          {
            text: 'Composable',
            link: '/configuration/composable',
          },
        ],
      },
    ],
  },
})
