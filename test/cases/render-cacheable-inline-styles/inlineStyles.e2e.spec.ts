import path from 'node:path'
import { setup, createPage, $fetch } from '@nuxt/test-utils/e2e'
import { describe, expect, test, beforeEach } from 'vitest'
import purgeAll from './../../__helpers__/purgeAll'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

describe('The RenderCacheable component with inlineStyles: true', () => {
  beforeEach(async () => {
    await purgeAll()
  })

  test('adds ssrContext.modules correctly', async () => {
    // The first request will render the component and add the used module identifier.
    // This in turn causes the component's styles to be inlined correctly.
    const markup1 = await $fetch('/')
    expect(markup1).toContain('#background-heading{background:red}')

    // The second request should get the component from cache and not render the component anymore.
    // But because the first render correctly determined the module identifiers and stored them in cache, it can add them, even if rendered from cache.
    const markup2 = await $fetch('/')
    expect(markup2).toContain('#background-heading{background:red}')

    const getTimestamp = async () => {
      const page = await createPage('/')
      const el = page.locator('#timestamp')
      return el.innerText()
    }

    const timestamp1 = await getTimestamp()
    const timestamp2 = await getTimestamp()

    // Make sure the component is actually returned from cache.
    // This is only the case if the timestamps are identical.
    expect(timestamp1).toEqual(timestamp2)
  })
})
