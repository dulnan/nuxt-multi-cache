import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import type { Storage } from 'unstorage'
import type {
  MultiCacheRuntimeConfig,
  MutliCacheServerOptions,
  NuxtMultiCacheSSRContext,
} from './../../../types'
import { getMultiCacheContext } from './../../../helpers/server'
import { useRuntimeConfig } from '#imports'
import serverOptions from '#multi-cache-server-options'

const runtimeConfig = useRuntimeConfig()

const AUTH_HEADER = 'x-nuxt-multi-cache-token'

export function getCacheInstance(event: H3Event): Storage {
  const cacheContext = getMultiCacheContext(event)
  if (!cacheContext) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load cache context.',
    })
  }
  const cacheName = event.context.params
    .cacheName as keyof NuxtMultiCacheSSRContext
  const cache = cacheContext[cacheName]
  if (!cache) {
    throw createError({
      statusCode: 404,
      statusMessage: `The given cache "${cacheName}" is not available.`,
    })
  }

  return cache
}

/**
 * Check the authorization for API endpoints.
 *
 * Throws an error if authorization failed.
 */
export async function checkAuth(
  event: H3Event,
  providedRuntimeConfig?: MultiCacheRuntimeConfig,
  providedServerOptions?: MutliCacheServerOptions,
) {
  const { authorizationDisabled, authorizationToken } =
    (providedRuntimeConfig || runtimeConfig.multiCache).api || {}

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

  const authorization = (providedServerOptions || serverOptions).api
    ?.authorization

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
