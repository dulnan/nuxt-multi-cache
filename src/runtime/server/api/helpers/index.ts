import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import type { Storage } from 'unstorage'
import { useMultiCacheApp } from '../../utils/useMultiCacheApp'
import type { NuxtMultiCacheSSRContext } from './../../../types'

const AUTH_HEADER = 'x-nuxt-multi-cache-token'

export function getCacheInstance(event: H3Event): Storage {
  const multiCache = useMultiCacheApp()

  const cacheName = event.context.params?.cacheName as
    | keyof NuxtMultiCacheSSRContext
    | undefined

  if (cacheName) {
    const cache = multiCache.cache[cacheName]
    if (cache) {
      return cache.storage
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
 * Throws an error if authorization failed.
 */
export async function checkAuth(event: H3Event) {
  const { serverOptions, config } = useMultiCacheApp()
  const { authorizationDisabled, authorizationToken } = config.api || {}

  // Allow if authorization is explicitly disabled.
  if (authorizationDisabled) {
    return
  }

  // Check authorization using token.
  if (authorizationToken) {
    const headerToken = getHeader(event, AUTH_HEADER)
    if (headerToken === authorizationToken) {
      return
    }
    // Unauthorized.
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const authorization = serverOptions.api?.authorization

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
