import type { ComponentCacheItem, RouteCacheItem } from '../types'
import { logger } from './logger'

const DELIMITER = '<CACHE_ITEM>'

/**
 * Encode the data of the route cache in a string.
 */
function encodeCacheItem(data: string, metadata: Record<string, any>): string {
  return JSON.stringify(metadata) + DELIMITER + data
}

/**
 * Decode the encoded route cache string item.
 */
function decodeCacheItem<T>(
  cacheItem: string,
): { metadata: T; data: string } | undefined {
  const delimiterPos = cacheItem.indexOf(DELIMITER)
  if (delimiterPos >= 0) {
    const metadata = JSON.parse(cacheItem.substring(0, delimiterPos))
    const data = cacheItem.substring(delimiterPos + DELIMITER.length)
    return { metadata, data }
  }
}

/**
 * Encode the data of the route cache in a string.
 */
export function encodeRouteCacheItem(
  data: string,
  headers: Record<string, any>,
  statusCode: number,
  expires: number | undefined,
  staleIfErrorExpires: number | undefined,
  staleWhileRevalidate: boolean | undefined,
  cacheTags: string[],
): string {
  return encodeCacheItem(data, {
    headers,
    statusCode,
    expires,
    cacheTags,
    staleIfErrorExpires,
    staleWhileRevalidate,
  })
}

/**
 * Decode the encoded route cache string item.
 */
export function decodeRouteCacheItem(
  cacheItem?: string,
): RouteCacheItem | undefined {
  if (!cacheItem) {
    return
  }

  try {
    const decoded = decodeCacheItem<Omit<RouteCacheItem, 'data'>>(cacheItem)
    if (decoded) {
      return {
        ...decoded.metadata,
        data: decoded.data,
      }
    }
  } catch (e) {
    logger.error('Failed to decode route cache item.', e)
  }
}

/**
 * Encode the component cache data.
 */
export function encodeComponentCacheItem(
  data: string,
  payload?: Record<string, any>,
  expires?: number | undefined,
  cacheTags?: string[],
  ssrModules?: string[],
): string {
  return encodeCacheItem(data, { payload, expires, cacheTags, ssrModules })
}

/**
 * Decode the encoded component cache string item.
 */
export function decodeComponentCacheItem(
  cacheItem: string,
): ComponentCacheItem | undefined {
  try {
    const decoded = decodeCacheItem<Omit<ComponentCacheItem, 'data'>>(cacheItem)
    if (decoded) {
      return {
        ...decoded.metadata,
        data: decoded.data,
      }
    }
  } catch (e) {
    logger.error('Failed to decode component cache item.', e)
  }
}

/**
 * Handle the return value from cache.getItemRaw().
 *
 * Not all drivers return strings, so this method handles the case where a
 * driver returns other types such as buffers.
 */
export function handleRawCacheData(
  data: string | Buffer | undefined | null,
): string | undefined {
  if (typeof data === 'string') {
    return data
  } else if (data instanceof Buffer) {
    return data.toString()
  }
}
