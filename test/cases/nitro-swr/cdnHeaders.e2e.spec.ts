import path from 'node:path'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The CDN headers with swr routeRules', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('are added to the response', async () => {
    const response = await fetch('/cdn-headers')
    expect(response.headers.get('surrogate-control')).toEqual('max-age=900')
  })

  test('are added to the response when served from Nitro cache', async () => {
    const first = await fetch('/cdn-headers')
    expect(first.headers.get('surrogate-control')).toEqual('max-age=900')

    const second = await fetch('/cdn-headers')
    expect(second.headers.get('surrogate-control')).toEqual('max-age=900')
  })
})
