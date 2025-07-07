import type { FetchContext, ResponseType, FetchResponse } from 'ofetch'
import { useRequestEvent, useRuntimeConfig } from '#imports'
import { useCDNHeaders } from './../server/utils/useCDNHeaders'
import { useRouteCache } from './../server/utils/useRouteCache'
import {
  ROUTE_CACHE_TAGS_HEADER,
  SERVER_REQUEST_HEADER,
} from '../helpers/constants'
import {
  cdnEnabled,
  isServer,
  routeCacheEnabled,
} from '#nuxt-multi-cache/config'
import type { BubbleCacheability } from '../types'

type OnResponseInterceptor = (
  ctx: FetchContext<unknown, ResponseType> & {
    response: FetchResponse<ResponseType>
  },
) => void

type OnRequestInterceptor = (ctx: FetchContext<unknown, ResponseType>) => void

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
 * maxAge and cacheTags from route-cached API routes to the current request.
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
          useCDNHeaders(
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
          const routeCacheTags = (
            ctx.response.headers.get(ROUTE_CACHE_TAGS_HEADER) || ''
          ).split(' ')

          if (routeCacheTags.length) {
            useRouteCache((helper) => {
              helper.addTags(routeCacheTags)
            }, event)
          }
        }
      },
      onRequest: function (ctx) {
        ctx.options.headers.append(SERVER_REQUEST_HEADER, 'true')
      },
    }
  }

  return {}
}
