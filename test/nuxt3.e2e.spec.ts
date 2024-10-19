import path from 'path'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test } from 'vitest'
import purgeAll from './__helpers__/purgeAll'

describe('With Nuxt 3 "classic" folder structure', async () => {
  await setup({
    rootDir: path.resolve(__dirname, './../playground-nuxt3'),
  })
  test('the serverOptions file is included correctly', async () => {
    await purgeAll()

    // First call puts it into cache.
    await $fetch('/', {
      method: 'get',
    })

    const stats: any = await $fetch('/__nuxt_multi_cache/stats/route')

    // If the serverOptions was included correctly, it will set a cache prefix.
    expect(stats.rows[0].key).toContain('MY_CACHE_PREFIX_')
  })
})
