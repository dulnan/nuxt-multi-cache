import { loadNuxt } from 'nuxt'
import { describe, expect, test, vi } from 'vitest'
import nuxtMultiCache from './../src/module'

async function testServerHandlerAdded(search: string, config: any) {
  const nuxt = await loadNuxt({})

  await nuxtMultiCache(config, nuxt)
  const handler = nuxt.options.serverHandlers.find((v) => {
    return v.handler?.includes(search)
  })
  expect(handler).toBeDefined()
  await nuxt.close()
}

describe('Module setup', () => {
  test('Should only add components if feature is enabled', async () => {
    const nuxt = await loadNuxt({})

    await nuxtMultiCache(
      {
        component: {
          enabled: true,
        },
      },
      nuxt,
    )
    const components: any[] = []
    await nuxt.callHook('components:extend', components)
    const component = components.find((v) => v.name === 'RenderCacheable')
    expect(component).toBeDefined()
    await nuxt.close()
  })

  test('Should only add API handlers if feature is enabled', async () => {
    const nuxt = await loadNuxt({})

    await nuxtMultiCache(
      {
        component: {
          enabled: true,
        },
        api: {
          enabled: true,
          authorization: 'asdf',
        },
      },
      nuxt,
    )
    const apiHandlers = nuxt.options.serverHandlers.filter((v) =>
      v.route?.includes('__nuxt_multi_cache'),
    )
    expect(apiHandlers.length).toEqual(5)
    await nuxt.close()
  })

  test('Should only add CDN handler if feature is enabled', async () => {
    await testServerHandlerAdded('cdnHeaders', { cdn: { enabled: true } })
  })

  test('Should only add route handler if feature is enabled', async () => {
    await testServerHandlerAdded('serveCachedRoute', {
      route: { enabled: true },
    })
  })

  test('Should only add responseSend if route cache or CDN is enabled.', async () => {
    await testServerHandlerAdded('responseSend', {
      route: { enabled: true },
    })
    await testServerHandlerAdded('responseSend', {
      cdn: { enabled: true },
    })
  })

  test('Should use provided API prefix.', async () => {
    const nuxt = await loadNuxt({})

    await nuxtMultiCache(
      {
        component: {
          enabled: true,
        },
        api: {
          enabled: true,
          authorization: 'asdf',
          prefix: '/__custom_prefix',
        },
      },
      nuxt,
    )
    const apiHandlers = nuxt.options.serverHandlers.filter((v) =>
      v.route?.includes('__custom_prefix'),
    )
    expect(apiHandlers.length).toEqual(5)
    await nuxt.close()
  })
})
