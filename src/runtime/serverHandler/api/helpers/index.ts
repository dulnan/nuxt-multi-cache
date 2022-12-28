import type { H3Event } from 'h3'
import { createError, getHeader } from 'h3'
import type { Storage } from 'unstorage'
import { NuxtMultiCacheOptions, NuxtMultiCacheSSRContext } from '../../../types'
import { getMultiCacheContext } from './../../../helpers/server'
import { getModuleConfig } from './../../helpers'

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
 */
export async function checkAuth(
  event: H3Event,
  providedModuleConfig?: NuxtMultiCacheOptions,
) {
  const moduleConfig = providedModuleConfig || (await getModuleConfig())
  const authorization = moduleConfig.api.authorization

  // Auth is disabled if it's explicity set to false.
  if (authorization === false) {
    return
  } else if (typeof authorization === 'function') {
    const result = await authorization(event)
    if (result) {
      return
    }
  } else if (typeof authorization === 'string') {
    // Check authorization.
    const headerToken = getHeader(event, AUTH_HEADER)
    if (headerToken === moduleConfig.api.authorization) {
      return
    }
  } else {
    throw createError({
      statusCode: 500,
      statusMessage: 'No authorization configuration option provided.',
    })
  }

  // Unauthorized.
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
  })
}
