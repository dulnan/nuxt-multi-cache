import { type H3Event, getQuery, getHeader } from 'h3'
import * as fsDriver from 'unstorage/drivers/fs'
import { defineMultiCacheOptions } from './../../src/server-options'

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
  return {
    data: {
      storage: {
        driver: fsDriver.default({
          base: './__cache__/data',
        }),
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
      storage: {
        driver: fsDriver.default({
          base: './__cache__/route',
        }),
      },
    },
    component: {
      storage: {
        driver: fsDriver.default({
          base: './__cache__/component',
        }),
      },
    },
    cacheKeyPrefix: (event: H3Event): Promise<string> => {
      return Promise.resolve(getCacheKeyPrefix(event))
    },
  }
})
