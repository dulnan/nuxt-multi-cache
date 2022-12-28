import { describe, expect, test } from 'vitest'
import { NuxtMultiCacheCDNHelper } from './../../src/runtime/helpers/CDNHelper'
import cdnHeadersHandler from './../../src/runtime/serverHandler/cdnHeaders'

describe('cdnHeaders server handler', () => {
  test('Adds the CDN helper to the event context', async () => {
    const event: any = {
      context: {},
    }
    await cdnHeadersHandler(event)
    expect(event.context.__MULTI_CACHE_CDN).toBeInstanceOf(
      NuxtMultiCacheCDNHelper,
    )
  })
})
