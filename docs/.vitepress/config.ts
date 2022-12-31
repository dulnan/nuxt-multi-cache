import { defineConfig } from 'vitepress'

export default defineConfig({
  base: (process.env.BASE_URL as `/${string}/` | undefined) || '/',
  title: 'Nuxt Multi Cache V2',
  lang: 'en',
  cleanUrls: 'without-subfolders',
  appearance: 'dark',
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
        link: 'https://nuxt-multi-cache-v1.dulnan.net',
      },
      { text: 'GitHub', link: 'https://github.com/dulnan/nuxt-multi-cache' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/overview/introduction' },
          { text: 'Configuration', link: '/overview/configuration' },
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
