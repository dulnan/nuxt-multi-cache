import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'
import getRouteCacheItems from './../../__helpers__/getRouteCacheItems'
import getDataCacheItems from './../../__helpers__/getDataCacheItems'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

const PREMIUM = { cookie: 'plan=premium' }

function getHtml(path: string, headers: Record<string, string> = {}) {
  return fetch(path, { headers }).then((response) => response.text())
}

describe('A cache key prefix that is empty for some requests', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('does not let requests without a prefix get routes stored with one', async () => {
    expect(await getHtml('/news', PREMIUM)).toContain('PREMIUM-CONTENT')

    // Without a prefix, the key is the path: "premium--/news".
    expect(await getHtml('/premium--/news')).not.toContain('PREMIUM-CONTENT')
  })

  test('does not let requests without a prefix get data stored with one', async () => {
    expect(await getHtml('/articles/a', PREMIUM)).toContain('PREMIUM-CONTENT')

    // Without a prefix, the data cache key is the slug: "premium--a".
    expect(await getHtml('/articles/premium--a')).toContain('PUBLIC-CONTENT')
  })

  test('stores the items of requests without a prefix with the "{none}" prefix', async () => {
    await getHtml('/articles/a')
    await getHtml('/articles/a', PREMIUM)

    const routeKeys = (await getRouteCacheItems()).map((row) => row.key)
    expect(routeKeys.sort()).toEqual([
      'premium--:articles:a',
      '{none}--:articles:a',
    ])

    const dataKeys = (await getDataCacheItems()).rows.map((row) => row.key)
    expect(dataKeys.sort()).toEqual(['premium--a', '{none}--a'])
  })
})
