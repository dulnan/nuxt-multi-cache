import path from 'path'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'
import { vi, describe, expect, test } from 'vitest'
import type { ModuleOptions } from '../src/build/options'
import purgeAll from './__helpers__/purgeAll'

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: {
      enabledForRequest: () => {
        // This will not inject the cache context to the event.
        return Promise.resolve(false)
      },
    },
  }
})

const multiCache: ModuleOptions = {
  component: {
    enabled: true,
  },
  data: {
    enabled: true,
  },
  route: {
    enabled: true,
  },
  cdn: {
    enabled: true,
  },
  api: {
    enabled: true,
    authorization: false,
    cacheTagInvalidationDelay: 5000,
  },
}

const nuxtConfig: any = {
  multiCache,
}

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  // browser: true,
  rootDir: path.resolve(__dirname, './../playground'),
  nuxtConfig,
})

describe('The purge and stats endpoints', () => {
  test('always have access to the cache context', async () => {
    async function getDataCacheCount(): Promise<number> {
      const response = await $fetch<any>('/__nuxt_multi_cache/stats/data', {
        method: 'get',
      })
      return response.rows.length
    }
    await purgeAll()
    expect(await getDataCacheCount()).toEqual(0)

    // First call puts it into cache.
    await createPage('/dataCache')

    expect(await getDataCacheCount()).toEqual(1)
  })
})
