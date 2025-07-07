import { cdnEnabled, routeCacheEnabled } from '#nuxt-multi-cache/config'
import type { BubbleCacheability, CacheableItemInterface } from '../types'
import type { H3Event } from 'h3'
import { useRouteCache } from './../server/utils/useRouteCache'
import { useCDNHeaders } from './../server/utils/useCDNHeaders'
import type { CacheabilityInterface } from './CacheabilityInterface'

export function bubbleCacheability(
  item: CacheableItemInterface | CacheabilityInterface,
  event: H3Event,
  value?: BubbleCacheability,
): void {
  if (routeCacheEnabled && (value === true || value === 'route')) {
    useRouteCache((route) => {
      if ('getMaxAge' in item) {
        route.mergeFromCacheability(item)
      } else {
        route.mergeFromCacheItem(item)
      }
    }, event)
  }

  if (cdnEnabled && (value === true || value === 'cdn')) {
    useCDNHeaders((cdn) => {
      if ('getMaxAge' in item) {
        cdn.mergeFromCacheability(item)
      } else {
        cdn.mergeFromCacheItem(item)
      }
    }, event)
  }
}
