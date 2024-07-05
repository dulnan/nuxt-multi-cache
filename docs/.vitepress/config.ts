import { defineConfig } from 'vitepress'

export default defineConfig({
  base: (process.env.BASE_URL as `/${string}/` | undefined) || '/',
  title: 'Multi Cache for Nuxt 3',
  lang: 'en',
  cleanUrls: true,
  appearance: 'dark',
  head: [
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://nuxt-multi-cache.dulnan.net/banner.jpg',
      },
    ],
  ],
  transformHead: (ctx) => {
    let url =
      '/' + ctx.pageData.relativePath.replace('index.md', '').replace('.md', '')
    if (url === '/') {
      url = ''
    }
    return Promise.resolve([
      ...ctx.head,
      [
        'link',
        { rel: 'canonical', href: 'https://nuxt-multi-cache.dulnan.net' + url },
      ],
    ])
  },
  description: 'Component, route and data cache for Nuxt 3.',
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
        link: 'https://nuxt-multi-cache-v1.dulnan.net',
      },
      { text: 'NPM', link: 'https://www.npmjs.com/package/nuxt-multi-cache' },
      { text: 'GitHub', link: 'https://github.com/dulnan/nuxt-multi-cache' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/overview/introduction' },
          { text: 'Configuration', link: '/overview/configuration' },
          { text: 'Server Options', link: '/overview/server-options' },
          { text: 'Cache Tags', link: '/overview/cache-tags' },
          { text: 'Migrating from V1', link: '/overview/migrating-from-v1' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Component Cache', link: '/features/component-cache' },
          { text: 'Route Cache', link: '/features/route-cache' },
          { text: 'Data Cache', link: '/features/data-cache' },
          { text: 'CDN Cache Control', link: '/features/cdn-cache-control' },
          { text: 'Purge API', link: '/features/api' },
        ],
      },
      {
        text: 'Composables',
        items: [
          { text: 'useDataCache', link: '/composables/useDataCache' },
          {
            text: 'useCachedAsyncData',
            link: '/composables/useCachedAsyncData',
          },
          { text: 'useRouteCache', link: '/composables/useRouteCache' },
          { text: 'useCDNHeaders', link: '/composables/useCDNHeaders' },
        ],
      },
      {
        text: 'Use Cases',
        items: [
          {
            text: 'Static Site Generation',
            link: '/use-cases/static-site-generation',
          },
          {
            text: 'External APIs',
            link: '/use-cases/external-apis',
          },
        ],
      },
      {
        text: 'Advanced',
        items: [
          {
            text: 'Defining Default Values',
            link: '/advanced/default-values',
          },
          {
            text: 'Cache Backend',
            link: '/advanced/cache-backend',
          },
          {
            text: 'Using Storage Instance',
            link: '/advanced/storage-instance',
          },
          {
            text: 'Using Route Cache + CDN',
            link: '/advanced/route-and-cdn',
          },
          {
            text: 'Enable Caching Conditionally',
            link: '/advanced/enable-cache-conditionally',
          },
        ],
      },
    ],
  },
})
