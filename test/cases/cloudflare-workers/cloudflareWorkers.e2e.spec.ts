import path from 'node:path'
import { setup, useTestContext } from '@nuxt/test-utils/e2e'
import { Miniflare } from 'miniflare'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'

// Only builds the app; it runs in workerd (Miniflare) instead of Node.
await setup({
  server: false,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
  // test-utils sets an older date, for which Nitro builds the legacy format
  // with Workers Sites.
  nuxtConfig: {
    compatibilityDate: '2025-04-27',
  },
})

let mf: Miniflare

beforeAll(() => {
  const outputDir = useTestContext().nuxt!.options.nitro.output!.dir!
  mf = new Miniflare({
    modules: true,
    scriptPath: path.resolve(outputDir, 'server/index.mjs'),
    modulesRoot: path.resolve(outputDir, 'server'),
    modulesRules: [{ type: 'ESModule', include: ['**/*.mjs'] }],
    compatibilityDate: '2025-04-27',
    compatibilityFlags: ['nodejs_compat'],
    kvNamespaces: ['CACHE'],
    assets: {
      directory: path.resolve(outputDir, 'public'),
      binding: 'ASSETS',
      routerConfig: { has_user_worker: true },
    },
  })
})

afterAll(async () => {
  await mf?.dispose()
})

/**
 * Get the render ID in the element with the given ID.
 */
async function getRenderId(path: string, id: string): Promise<string> {
  const response = await mf.dispatchFetch(`http://localhost${path}`)
  expect(response.status).toBe(200)
  const html = await response.text()
  const renderId = new RegExp(`id="${id}">([^<]+)<`).exec(html)?.[1]
  expect(renderId).toBeTruthy()
  return renderId!
}

async function purge(path: string, body?: string[]) {
  const response = await mf.dispatchFetch(
    `http://localhost/__nuxt_multi_cache/purge/${path}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    },
  )
  expect(response.status).toBe(200)
}

/**
 * The part of the KV namespace used here. Its full type is in
 * @cloudflare/workers-types.
 */
type KVNamespace = {
  list(): Promise<{ keys: { name: string }[] }>
}

/**
 * Get all keys in the KV namespace.
 */
async function getKvKeys(): Promise<string[]> {
  const kv = (await mf.getKVNamespace('CACHE')) as unknown as KVNamespace
  const { keys } = await kv.list()
  return keys.map((key) => key.name).sort()
}

describe('On Cloudflare Workers', () => {
  beforeEach(async () => {
    await purge('all')
  })

  test('the route cache stores pages in KV', async () => {
    const renderId = await getRenderId('/route', 'page')
    expect(await getRenderId('/route', 'page')).toBe(renderId)
    // The API route that the page fetched is cached as well.
    expect(await getKvKeys()).toEqual(['route:api:render-id', 'route:route'])
  })

  test('the component cache stores components in KV', async () => {
    const renderId = await getRenderId('/component', 'component')
    expect(await getRenderId('/component', 'component')).toBe(renderId)
    expect(await getKvKeys()).toEqual(['component:RenderId:render-id'])
  })

  test('the data cache stores data in KV', async () => {
    const renderId = await getRenderId('/data', 'data')
    expect(await getRenderId('/data', 'data')).toBe(renderId)
    expect(await getKvKeys()).toEqual(['data:render-id'])
  })

  test('purges a page by the cache tag of an API route it fetched', async () => {
    const renderId = await getRenderId('/route', 'page')
    await purge('tags', ['api'])
    expect(await getKvKeys()).toEqual([])
    expect(await getRenderId('/route', 'page')).not.toBe(renderId)
  })

  test('adds the cache tag of a cached API route to the page', async () => {
    const apiRenderId = await getRenderId('/route', 'api')

    // Only the page is removed, the API route stays cached.
    await purge('route', ['route'])
    const renderId = await getRenderId('/route', 'page')
    expect(await getRenderId('/route', 'api')).toBe(apiRenderId)

    await purge('tags', ['api'])
    expect(await getRenderId('/route', 'page')).not.toBe(renderId)
  })

  test('purges a single item', async () => {
    const renderId = await getRenderId('/route', 'page')
    await getRenderId('/data', 'data')
    await purge('route', ['route'])
    expect(await getKvKeys()).toEqual(['data:render-id', 'route:api:render-id'])
    expect(await getRenderId('/route', 'page')).not.toBe(renderId)
  })

  test('purges all items', async () => {
    await getRenderId('/route', 'page')
    await getRenderId('/component', 'component')
    await getRenderId('/data', 'data')
    await purge('all')
    expect(await getKvKeys()).toEqual([])
  })
})
