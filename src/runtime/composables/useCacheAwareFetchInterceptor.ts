import type { FetchContext, ResponseType, FetchResponse } from 'ofetch'
import { useRequestEvent, useRuntimeConfig } from '#imports'
import { useRouteCache } from './../server/utils/useRouteCache'
import {
  ROUTE_CACHE_EXPIRES_HEADER,
  ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
  ROUTE_CACHE_TAGS_HEADER,
  SERVER_REQUEST_HEADER,
} from '../helpers/constants'
import {
  cdnEnabled,
  isServer,
  routeCacheEnabled,
} from '#nuxt-multi-cache/config'
import type { BubbleCacheability } from '../types'
import { useCDNHeadersImplementation } from '../shared/useCDNHeaders'

type OnResponseInterceptor = (
  ctx: FetchContext<unknown, ResponseType> & {
    response: FetchResponse<ResponseType>
  },
) => void

type OnRequestInterceptor = (ctx: FetchContext<unknown, ResponseType>) => void

/**
 * Get a numeric header value, if present.
 */
function getNumericHeader(headers: Headers, name: string): number | undefined {
  const value = headers.get(name)
  if (value === null) {
    return
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

type UseCacheAwareFetchInterceptor = {
  onResponse?: OnResponseInterceptor
  onRequest?: OnRequestInterceptor
}

/**
 * Returns onResponse and onRequest fetch interceptors that will bubble
 * cacheability from the response to the current request event.
 *
 * The onResponse interceptor will merge CDN headers from CDN cached API routes
 * to the current request and merge them.
 *
 * If the route cache is enabled, the onResponse interceptor will also bubble
 * the route cache tags, max age and stale-if-error of API routes to the
 * current request.
 *
 * The onRequest interceptor adds a special request header to indicate that
 * this is an internal request originating from Nuxt during SSR.
 *
 * @param bubbleCacheability Which cacheability to bubble. true => everything,
 * route => only route cache, cdn => only CDN headers. Defaults to true.
 */
export function useCacheAwareFetchInterceptor(
  bubbleCacheability: BubbleCacheability = true,
): UseCacheAwareFetchInterceptor {
  const config = useRuntimeConfig()

  if (isServer && (config.multiCache.cdn || config.multiCache.route)) {
    const event = useRequestEvent()

    if (!event) {
      return {}
    }

    return {
      onResponse: function (ctx) {
        if (
          cdnEnabled &&
          config.multiCache.cdn &&
          (bubbleCacheability === true || bubbleCacheability === 'cdn')
        ) {
          useCDNHeadersImplementation(
            (cdn) => {
              cdn.mergeFromResponse(ctx.response)
            },
            event,
            false,
          )
        }

        if (
          routeCacheEnabled &&
          config.multiCache.route &&
          (bubbleCacheability === true || bubbleCacheability === 'route')
        ) {
          // The headers are missing if the API route doesn't use the route
          // cache.
          const headers = ctx.response.headers
          const cacheTags = (headers.get(ROUTE_CACHE_TAGS_HEADER) || '')
            .split(' ')
            .filter(Boolean)
          const expires = getNumericHeader(headers, ROUTE_CACHE_EXPIRES_HEADER)
          const staleIfErrorExpires = getNumericHeader(
            headers,
            ROUTE_CACHE_STALE_IF_ERROR_EXPIRES_HEADER,
          )

          useRouteCache((helper) => {
            helper.mergeFromCacheItem({
              cacheTags,
              expires,
              staleIfErrorExpires,
            })
          }, event)
        }
      },
      onRequest: function (ctx) {
        // Set, not appended: The headers may already contain it, forwarded
        // from the page request by Nuxt or from the first attempt when ofetch
        // retries. "x, true" would not be recognized as an internal request.
        ctx.options.headers.set(SERVER_REQUEST_HEADER, 'true')
      },
    }
  }

  return {}
}
