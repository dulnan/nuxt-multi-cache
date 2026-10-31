import { afterEach, describe, expect, test, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import plugin from '../../../src/runtime/server/plugins/multiCache'
import { logger } from '../../../src/runtime/helpers/multi-cache-logger'

const mocks = vi.hoisted(() => {
  return {
    isTestMode: false,
    cdn: false,
    cdnPrivateCacheControl: true,
  }
})

vi.mock('#nuxt-multi-cache/config', () => {
  return {
    get isTestMode() {
      return mocks.isTestMode
    },
    debug: false,
    isServer: true,
    shouldLogCacheOverview: false,
    cdnEnabled: true,
    get cdnPrivateCacheControl() {
      return mocks.cdnPrivateCacheControl
    },
    componentCacheEnabled: false,
    dataCacheEnabled: false,
    routeCacheEnabled: false,
  }
})

vi.mock('#nuxt-multi-cache/server-options', () => {
  return {
    serverOptions: {},
  }
})

vi.mock('nitropack/runtime', () => {
  return {
    defineNitroPlugin: (fn: unknown) => fn,
  }
})

mockNuxtImport('useRuntimeConfig', (original) => {
  return () => {
    return {
      ...original(),
      multiCache: {
        cdn: mocks.cdn,
        component: false,
        data: false,
        route: false,
        api: {
          enabled: false,
        },
      },
    }
  }
})

function runPlugin() {
  const nitroApp: any = {
    hooks: { hook: vi.fn() },
    h3App: { stack: [] },
  }
  ;(plugin as unknown as (app: any) => void)(nitroApp)
  return nitroApp.hooks.hook.mock.calls.map((call: unknown[]) => call[0])
}

describe('The nuxt-multi-cache Nitro plugin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('warns at startup if test mode is enabled', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    mocks.isTestMode = true
    runPlugin()

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('Test mode is enabled')
  })

  test.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])(
    'with the CDN feature %s and privateCacheControl %s, registers the beforeResponse hook: %s',
    (cdn, privateCacheControl, expected) => {
      mocks.cdn = cdn
      mocks.cdnPrivateCacheControl = privateCacheControl
      expect(runPlugin().includes('beforeResponse')).toBe(expected)
      mocks.cdn = false
      mocks.cdnPrivateCacheControl = true
    },
  )

  test('does not warn if test mode is disabled', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    mocks.isTestMode = false
    runPlugin()

    expect(warn).not.toHaveBeenCalled()
  })
})
