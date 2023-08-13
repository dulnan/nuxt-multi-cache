import { ComponentCacheItem, RouteCacheItem } from '../types'

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
  cacheTags: string[],
): string {
  return encodeCacheItem(data, { headers, statusCode, expires, cacheTags })
}

/**
 * Decode the encoded route cache string item.
 */
export function decodeRouteCacheItem(
  cacheItem: string,
): RouteCacheItem | undefined {
  try {
    const decoded = decodeCacheItem<Omit<RouteCacheItem, 'data'>>(cacheItem)
    if (decoded) {
      return {
        ...decoded.metadata,
        data: decoded.data,
      }
    }
  } catch (e) {}
}

/**
 * Encode the component cache data.
 */
export function encodeComponentCacheItem(
  data: string,
  payload?: Record<string, any>,
  expires?: number | undefined,
  cacheTags?: string[],
): string {
  return encodeCacheItem(data, { payload, expires, cacheTags })
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
  } catch (e) {}
}
