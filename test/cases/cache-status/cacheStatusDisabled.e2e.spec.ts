import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import purgeAll from '~/test/__helpers__/purgeAll'
import getRouteCacheItems from '~/test/__helpers__/getRouteCacheItems'
import { TEST_MODE_DATE_OVERRIDE_HEADER } from '~/src/runtime/helpers/constants'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  // Enabled in the module options, but disabled at runtime.
  env: {
    NUXT_MULTI_CACHE_ROUTE_CACHE_STATUS: 'false',
  },
})

const NOW = new Date('2026-01-01T12:00:00.000Z')

async function getCacheStatus(url: string, date = NOW) {
  const response = await fetch(url, {
    headers: {
      [TEST_MODE_DATE_OVERRIDE_HEADER]: date.toISOString(),
      accept: 'text/html',
    },
  })
  return response.headers.get('cache-status')
}

describe('The Cache-Status header disabled via runtime config', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('is not added', async () => {
    expect(await getCacheStatus('/cached')).toBeNull()
    expect(await getCacheStatus('/cached')).toBeNull()
    expect(await getCacheStatus('/styles.css')).toBeNull()
    expect(await getCacheStatus('/does-not-exist')).toBeNull()
  })

  test('is not added to stale routes served because of an error', async () => {
    await getCacheStatus('/stale-if-error')
    const later = new Date(NOW.getTime() + 120_000)
    expect(await getCacheStatus('/stale-if-error?fail=true', later)).toBeNull()
  })

  test('leaves the Cache-Status header of the app as it is', async () => {
    expect(await getCacheStatus('/upstream')).toEqual('upstream-cache; hit')
    expect(await getCacheStatus('/upstream')).toEqual('upstream-cache; hit')

    const items = await getRouteCacheItems()
    const item = items.find((v) => v.key === 'upstream')!.item
    expect(item.headers['cache-status']).toEqual('upstream-cache; hit')
  })
})
