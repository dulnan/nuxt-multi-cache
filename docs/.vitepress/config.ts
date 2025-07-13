import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import simpleGit from 'simple-git'

const getCurrentBranch = async () => {
  try {
    const git = simpleGit(path.resolve(__dirname, '../..'))
    const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
    return branch.trim()
  } catch (error) {
    console.warn(
      'Could not determine git branch, falling back to "main":',
      error.message,
    )
    return 'main'
  }
}

const TYPE_FILES = [
  './../../src/runtime/types/index.ts',
  './../../src/runtime/types/CacheTagRegistry.ts',
  './../../src/runtime/helpers/maxAge.ts',
]

const getTypeFiles = async () => {
  const branch = await getCurrentBranch()
  const allFiles = TYPE_FILES.flatMap((relativePath) => {
    const rootPath = path.resolve(__dirname, '../..')
    const filePath = path.resolve(__dirname, relativePath)
    const githubUrl = filePath.replace(
      rootPath,
      `https://www.github.com/dulnan/nuxt-multi-cache/tree/${branch}`,
    )
    return fs
      .readFileSync(filePath)
      .toString()
      .split('\n')
      .map((line, index) => {
        const rgx = /(type|interface) ([A-Z][^ <]*)/g
        const typeName = [...line.matchAll(rgx)][0]?.[2]
        if (typeName) {
          return {
            githubUrl: githubUrl + '#L' + (index + 1),
            typeName,
          }
        }
      })
      .filter(Boolean)
  })

  return allFiles.reduce((acc, v) => {
    acc[v!.typeName] = v!.githubUrl
    return acc
  }, {})
}

const typesMap = await getTypeFiles()

function typeReferencePlugin(md) {
  const regex = /\[type\.(\w+(\[\])?)\]/g

  function replaceToken(tokens, idx) {
    const token = tokens[idx]
    const match = [...token.content.matchAll(regex)][0]

    if (match) {
      const arg = match[0].slice(6, -1)
      const typeName = arg.replace('[', '').replace(']', '')

      const githubUrl = typesMap[typeName]

      if (!githubUrl) {
        throw new Error(`Failed to link type with name: "${typeName}"`)
      }

      token.type = 'html_inline'
      token.content = token.content.replace(
        regex,
        `<a href="${githubUrl}" target="_blank"><code>${arg}</code></a>`,
      )
    }
  }

  md.core.ruler.push('replace_type_reference', function (state) {
    state.tokens.forEach((blockToken) => {
      if (blockToken.type === 'inline' && blockToken.children) {
        blockToken.children.forEach((token, idx) => {
          replaceToken(blockToken.children, idx)
        })
      }
    })
  })
}

const composables = [
  'useDataCache',
  'useCachedAsyncData',
  'useDataCacheCallback',
  'useRouteCache',
  'useCDNHeaders',
  'useComponentCache',
  'useMultiCacheApp',
  'useCacheAwareFetchInterceptor',
].sort()

export default defineConfig({
  base: (process.env.BASE_URL as `/${string}/` | undefined) || '/',
  title: 'Nuxt Multi Cache',
  lang: 'en',
  cleanUrls: true,
  appearance: 'dark',
  markdown: {
    config: (md) => {
      md.use(typeReferencePlugin)
    },
  },
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
          { text: 'Runtime Config', link: '/overview/runtime-config' },
          { text: 'Server Options', link: '/overview/server-options' },
          { text: 'Cache Tags', link: '/overview/cache-tags' },
          { text: 'Max Age', link: '/overview/max-age' },
          { text: 'Stale if Error', link: '/overview/stale-if-error' },
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
        text: 'Composables / Server Utils',
        items: composables.map((name) => {
          return {
            text: name,
            link: '/composables/' + name,
          }
        }),
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
            text: 'Route Cache with Compression',
            link: '/advanced/route-cache-with-compression',
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
