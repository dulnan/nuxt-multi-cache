import { defineDriver } from 'unstorage'
import { type H3Event, getQuery, getHeader } from 'h3'
import { defineMultiCacheOptions } from './../../src/server-options'
import * as fsDriver from 'unstorage/drivers/fs'

function getCacheKeyPrefix(event: H3Event): string {
  const query = getQuery(event)
  if (query.language && typeof query.language === 'string') {
    return query.language
  }

  const acceptLanguage = getHeader(event, 'accept-language') || ''

  if (
    acceptLanguage &&
    typeof acceptLanguage === 'string' &&
    acceptLanguage.includes('de')
  ) {
    return 'de'
  }
  return 'en'
}

export default defineMultiCacheOptions(() => {
  const customDriver = defineDriver(function () {
    let cache: Record<string, string> = {}
    return {
      hasItem(key: string) {
        return !!cache[key]
      },
      getItem(key: string) {
        if (key.includes('static_item_for_test')) {
          return JSON.stringify({ data: 'just_an_example_value' })
        }
        return cache[key] || null
      },
      setItem(key, value) {
        cache[key] = value
      },
      removeItem(key) {
        delete cache[key]
      },
      getKeys() {
        return Object.keys(cache)
      },
      clear() {
        cache = {}
      },
      dispose() {},
    }
  })

  // This is not really used, but we'll leave this here to test that it is not
  // included in the final client build, which should be handled by the
  // custom build plugin added by the module.
  // If it would be included, the build would fail, because the FS driver has
  // imports on stuff that does not exist in the browser.
  const foobar = fsDriver.default({
    base: './__cache__/data',
  })

  return {
    data: {
      storage: {
        driver: customDriver({}),
      },
    },
    route: {
      alterCachedHeaders(headers) {
        const cookie = headers['set-cookie']
        // Remove the SESSION cookie.
        if (cookie) {
          if (typeof cookie === 'string') {
            if (cookie.includes('SESSION')) {
              headers['set-cookie'] = undefined
            }
          } else if (Array.isArray(cookie)) {
            const remaining = cookie.filter((v) => !v.includes('SESSION'))
            if (!remaining.length) {
              headers['set-cookie'] = undefined
            } else {
              headers['set-cookie'] = remaining
            }
          }
        }
        return headers
      },
    },
    component: {},
    cacheKeyPrefix: (event: H3Event): Promise<string> => {
      return Promise.resolve(getCacheKeyPrefix(event))
    },
  }
})
