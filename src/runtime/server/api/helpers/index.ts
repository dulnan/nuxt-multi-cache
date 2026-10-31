import type { H3Event } from 'h3'
import { createError, getHeader, setResponseHeaders } from 'h3'
import type { Storage } from 'unstorage'
import { getMultiCacheApp } from '../../utils/useMultiCacheApp'
import { useCDNHeadersImplementation } from '../../../shared/useCDNHeaders'
import type { CacheType, MultiCacheInstances } from './../../../types'

const AUTH_HEADER = 'x-nuxt-multi-cache-token'

export function getCacheInstance(event: H3Event): {
  storage: Storage
  name: CacheType
} {
  const multiCache = getMultiCacheApp()

  const cacheName = event.context.params?.cacheName as
    | keyof MultiCacheInstances
    | undefined

  if (cacheName) {
    const cache = multiCache.cache[cacheName]
    if (cache) {
      return { storage: cache.storage, name: cacheName }
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: `The given cache "${cacheName}" is not available.`,
  })
}

/**
 * Check the authorization for API endpoints.
 *
 * Throws an error if the API is disabled via runtime config or if
 * authorization failed.
 */
export async function checkAuth(event: H3Event) {
  // The responses contain stored content, which must never be rendered as a
  // document that can run scripts, should a response be sent as text/html.
  setResponseHeaders(event, {
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
    // The responses depend on the authorization, which caches can't know
    // about, e.g. the token is sent in a custom header.
    'cache-control': 'private, no-store',
  })

  // A middleware may have marked every response as public for the CDN.
  // Private is final, so later calls can't make the response public again.
  useCDNHeadersImplementation((cdn) => {
    cdn.private().setBoolean('noStore').setNumeric('maxAge', 0)
  }, event)

  const app = getMultiCacheApp()

  // The API can be disabled via runtime config. Respond as if the endpoints
  // didn't exist, before checking any authorization.
  if (!app.config.api.enabled) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  }

  // Check authorization using token. A token is always required if one is set,
  // even if authorization is disabled: The token may be set via runtime config
  // for an environment, while `authorization: false` is in nuxt.config.ts.
  if (app.config.api.authorizationToken) {
    const headerToken = getHeader(event, AUTH_HEADER)
    if (headerToken === app.config.api.authorizationToken) {
      return
    }
    // Unauthorized.
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  // Allow if authorization is explicitly disabled.
  if (app.config.api.authorizationDisabled) {
    return
  }

  const authorization = app.serverOptions.api?.authorization

  // At this stage if this method is missing, we throw an error to indicate
  // that the module is not configured properly.
  if (!authorization) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No authorization configuration option provided.',
    })
  }

  const result = await authorization(event)
  if (result) {
    return
  }

  // Unauthorized.
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
  })
}
