import { CacheTagInvalidator } from '~/src/runtime/helpers/CacheTagInvalidator'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createStorage } from 'unstorage'
import type { MultiCacheInstances } from '~/src/runtime/types'
import type { CacheTagRegistry } from '~/src/runtime/types/CacheTagRegistry'
import {
  encodeComponentCacheItem,
  encodeRouteCacheItem,
} from '~/src/runtime/helpers/cacheItem'

vi.mock('#nuxt-multi-cache/config', () => ({
  cacheTagInvalidationDelay: 100,
  isTestMode: true,
}))

describe('CacheTagInvalidator', () => {
  let cacheTagInvalidator: CacheTagInvalidator
  let mockCacheTagRegistry: CacheTagRegistry
  let cacheContext: MultiCacheInstances

  function getTags(): Set<string> {
    // @ts-expect-error private property.
    return cacheTagInvalidator.tags
  }

  function getTimeout(): NodeJS.Timeout | null {
    // @ts-expect-error private property.
    return cacheTagInvalidator.timeout
  }

  beforeEach(() => {
    vi.useFakeTimers()

    // Create mock storage instances
    const storageData = createStorage()
    const storageRoute = createStorage()
    const storageComponent = createStorage()

    cacheContext = {
      data: { storage: storageData, bubbleError: false },
      route: { storage: storageRoute, bubbleError: false },
      component: { storage: storageComponent, bubbleError: false },
    }

    // Mock cache tag registry
    mockCacheTagRegistry = {
      getCacheKeysForTags: vi.fn(),
      removeTags: vi.fn(),
      purgeCache: vi.fn(),
      purgeEverything: vi.fn(),
      addCacheTags: vi.fn(),
      removeCacheItem: vi.fn(),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with cache instances and registry', () => {
      cacheTagInvalidator = new CacheTagInvalidator(
        cacheContext,
        mockCacheTagRegistry,
      )

      expect(cacheTagInvalidator).toBeInstanceOf(CacheTagInvalidator)
    })

    it('should initialize with null registry', () => {
      cacheTagInvalidator = new CacheTagInvalidator(cacheContext, null)

      expect(cacheTagInvalidator).toBeInstanceOf(CacheTagInvalidator)
    })
  })

  describe('add', () => {
    beforeEach(() => {
      cacheTagInvalidator = new CacheTagInvalidator(
        cacheContext,
        mockCacheTagRegistry,
      )
    })

    it('should add tags to the internal set', () => {
      cacheTagInvalidator.add(['tag1', 'tag2'])

      // Access private property for testing.
      // @ts-expect-error private property
      const tags = cacheTagInvalidator.tags
      expect(tags.has('tag1')).toBe(true)
      expect(tags.has('tag2')).toBe(true)
    })

    it('should not add duplicate tags', () => {
      cacheTagInvalidator.add(['tag1', 'tag1', 'tag2'])

      // @ts-expect-error private property
      const tags = cacheTagInvalidator.tags
      expect(tags.size).toBe(2)
      expect(tags.has('tag1')).toBe(true)
      expect(tags.has('tag2')).toBe(true)
    })

    it('should handle empty array', () => {
      cacheTagInvalidator.add([])

      const tags = getTags()
      expect(tags.size).toBe(0)
    })

    it('should handle undefined parameter', () => {
      cacheTagInvalidator.add()

      const tags = getTags()
      expect(tags.size).toBe(0)
    })

    it('should set timeout for invalidation', () => {
      const invalidateSpy = vi.spyOn(cacheTagInvalidator, 'invalidate')

      cacheTagInvalidator.add(['tag1'])

      expect(getTimeout()).not.toBeNull()

      vi.advanceTimersByTime(100)

      expect(invalidateSpy).toHaveBeenCalledOnce()
    })

    it('should not create multiple timeouts', () => {
      cacheTagInvalidator.add(['tag1'])
      const firstTimeout = getTimeout()

      cacheTagInvalidator.add(['tag2'])
      const secondTimeout = getTimeout()

      expect(firstTimeout).toBe(secondTimeout)
    })
  })

  describe('getCacheTags', () => {
    beforeEach(() => {
      cacheTagInvalidator = new CacheTagInvalidator(
        cacheContext,
        mockCacheTagRegistry,
      )
    })

    it('should get cache tags from data cache', async () => {
      await cacheContext.data!.storage.setItem('data1', {
        data: 'test data',
        cacheTags: ['tag1', 'tag2'],
      })

      const tags = await cacheTagInvalidator.getCacheTags('data', 'data1')

      expect(tags).toEqual(['tag1', 'tag2'])
    })

    it('should return undefined for data cache item without cache tags', async () => {
      await cacheContext.data!.storage.setItem('data1', {
        data: 'test data',
      })

      const tags = await cacheTagInvalidator.getCacheTags('data', 'data1')

      expect(tags).toBeUndefined()
    })

    it('should return undefined for non-existent data cache item', async () => {
      const tags = await cacheTagInvalidator.getCacheTags('data', 'nonexistent')

      expect(tags).toBeUndefined()
    })

    it('should get cache tags from route cache', async () => {
      const encodedItem = encodeRouteCacheItem(
        'route data',
        { 'content-type': 'text/html' },
        200,
        1000,
        500,
        true,
        ['route-tag1', 'route-tag2'],
      )

      await cacheContext.route!.storage.setItemRaw('route1', encodedItem)

      const tags = await cacheTagInvalidator.getCacheTags('route', 'route1')

      expect(tags).toEqual(['route-tag1', 'route-tag2'])
    })

    it('should return undefined for invalid route cache item', async () => {
      await cacheContext.route!.storage.setItemRaw('route1', 'invalid data')

      const tags = await cacheTagInvalidator.getCacheTags('route', 'route1')

      expect(tags).toBeUndefined()
    })

    it('should get cache tags from component cache', async () => {
      const encodedItem = encodeComponentCacheItem(
        'component data',
        { prop: 'value' },
        1000,
        ['comp-tag1', 'comp-tag2'],
        ['module1'],
      )

      await cacheContext.component!.storage.setItemRaw(
        'component1',
        encodedItem,
      )

      const tags = await cacheTagInvalidator.getCacheTags(
        'component',
        'component1',
      )

      expect(tags).toEqual(['comp-tag1', 'comp-tag2'])
    })

    it('should return undefined for invalid component cache item', async () => {
      await cacheContext.component!.storage.setItemRaw(
        'component1',
        'invalid data',
      )

      const tags = await cacheTagInvalidator.getCacheTags(
        'component',
        'component1',
      )

      expect(tags).toBeUndefined()
    })
  })

  describe('invalidate with cache tag registry', () => {
    beforeEach(() => {
      cacheTagInvalidator = new CacheTagInvalidator(
        cacheContext,
        mockCacheTagRegistry,
      )
    })

    it('should use cache tag registry for efficient invalidation', async () => {
      const mockInvalidationMap = {
        data: ['data1', 'data2'],
        route: ['route1'],
        component: ['component1'],
      }

      mockCacheTagRegistry.getCacheKeysForTags = vi
        .fn()
        .mockResolvedValue(mockInvalidationMap)
      mockCacheTagRegistry.removeTags = vi.fn().mockResolvedValue(undefined)

      // Add some test data
      await cacheContext.data!.storage.setItem('data1', { data: 'test' })
      await cacheContext.data!.storage.setItem('data2', { data: 'test' })
      await cacheContext.route!.storage.setItemRaw('route1', 'test')
      await cacheContext.component!.storage.setItemRaw('component1', 'test')

      cacheTagInvalidator.add(['tag1', 'tag2'])

      const result = await cacheTagInvalidator.invalidate()

      expect(mockCacheTagRegistry.getCacheKeysForTags).toHaveBeenCalledWith([
        'tag1',
        'tag2',
      ])
      expect(mockCacheTagRegistry.removeTags).toHaveBeenCalledWith([
        'tag1',
        'tag2',
      ])

      // Verify items were removed
      expect(await cacheContext.data!.storage.hasItem('data1')).toBe(false)
      expect(await cacheContext.data!.storage.hasItem('data2')).toBe(false)
      expect(await cacheContext.route!.storage.hasItem('route1')).toBe(false)
      expect(await cacheContext.component!.storage.hasItem('component1')).toBe(
        false,
      )

      expect(result).toBe(true)
    })

    it('should handle empty invalidation map', async () => {
      mockCacheTagRegistry.getCacheKeysForTags = vi.fn().mockResolvedValue({})
      mockCacheTagRegistry.removeTags = vi.fn().mockResolvedValue(undefined)

      cacheTagInvalidator.add(['tag1'])

      const result = await cacheTagInvalidator.invalidate()

      expect(mockCacheTagRegistry.getCacheKeysForTags).toHaveBeenCalledWith([
        'tag1',
      ])
      expect(mockCacheTagRegistry.removeTags).toHaveBeenCalledWith(['tag1'])
      expect(result).toBe(true)
    })

    it('should handle missing cache instances gracefully', async () => {
      const mockInvalidationMap = {
        data: ['data1'],
        route: ['route1'],
        component: ['component1'],
      }

      mockCacheTagRegistry.getCacheKeysForTags = vi
        .fn()
        .mockResolvedValue(mockInvalidationMap)
      mockCacheTagRegistry.removeTags = vi.fn().mockResolvedValue(undefined)

      // Create invalidator with missing cache instances
      const incompleteCacheContext: MultiCacheInstances = {
        data: cacheContext.data,
        // route and component are missing
      }

      const invalidator = new CacheTagInvalidator(
        incompleteCacheContext,
        mockCacheTagRegistry,
      )
      invalidator.add(['tag1'])

      const result = await invalidator.invalidate()

      expect(result).toBe(true)
      expect(mockCacheTagRegistry.removeTags).toHaveBeenCalled()
    })
  })

  describe('invalidate without cache tag registry (fallback)', () => {
    beforeEach(() => {
      cacheTagInvalidator = new CacheTagInvalidator(cacheContext, null)
    })

    it('should invalidate using fallback method', async () => {
      // Set up test data with cache tags
      await cacheContext.data!.storage.setItem('data1', {
        data: 'test data 1',
        cacheTags: ['tag1'],
      })

      await cacheContext.data!.storage.setItem('data2', {
        data: 'test data 2',
        cacheTags: ['tag2'],
      })

      const encodedRoute = encodeRouteCacheItem(
        'route data',
        {},
        200,
        1000,
        500,
        false,
        ['tag1', 'tag3'],
      )
      await cacheContext.route!.storage.setItemRaw('route1', encodedRoute)

      const encodedComponent = encodeComponentCacheItem(
        'component data',
        {},
        1000,
        ['tag2'],
      )
      await cacheContext.component!.storage.setItemRaw(
        'component1',
        encodedComponent,
      )

      cacheTagInvalidator.add(['tag1', 'tag2'])

      const result = await cacheTagInvalidator.invalidate()

      // Items with matching tags should be removed
      expect(await cacheContext.data!.storage.hasItem('data1')).toBe(false) // has tag1
      expect(await cacheContext.data!.storage.hasItem('data2')).toBe(false) // has tag2
      expect(await cacheContext.route!.storage.hasItem('route1')).toBe(false) // has tag1
      expect(await cacheContext.component!.storage.hasItem('component1')).toBe(
        false,
      ) // has tag2

      expect(result).toBe(true)
    })

    it('should not invalidate items without matching tags', async () => {
      await cacheContext.data!.storage.setItem('data1', {
        data: 'test data 1',
        cacheTags: ['different-tag'],
      })

      cacheTagInvalidator.add(['tag1'])

      await cacheTagInvalidator.invalidate()

      // Item should still exist
      expect(await cacheContext.data!.storage.hasItem('data1')).toBe(true)
    })

    it('should handle items without cache tags', async () => {
      await cacheContext.data!.storage.setItem('data1', {
        data: 'test data without tags',
      })

      cacheTagInvalidator.add(['tag1'])

      await cacheTagInvalidator.invalidate()

      // Item should still exist
      expect(await cacheContext.data!.storage.hasItem('data1')).toBe(true)
    })

    it('should handle missing cache instances gracefully', async () => {
      const incompleteCacheContext: MultiCacheInstances = {
        data: cacheContext.data,
        // other caches are missing
      }

      const invalidator = new CacheTagInvalidator(incompleteCacheContext, null)
      invalidator.add(['tag1'])

      const result = await invalidator.invalidate()

      expect(result).toBe(true)
    })
  })

  describe('timeout and state management', () => {
    beforeEach(() => {
      cacheTagInvalidator = new CacheTagInvalidator(
        cacheContext,
        mockCacheTagRegistry,
      )
      mockCacheTagRegistry.getCacheKeysForTags = vi.fn().mockResolvedValue({})
      mockCacheTagRegistry.removeTags = vi.fn().mockResolvedValue(undefined)
    })

    it('should clear tags and timeout after invalidation', async () => {
      cacheTagInvalidator.add(['tag1', 'tag2'])

      await cacheTagInvalidator.invalidate()

      expect(getTags().size).toBe(0)
      expect(getTimeout()).toBeNull()
    })

    it('should handle multiple add calls before timeout', () => {
      cacheTagInvalidator.add(['tag1'])
      cacheTagInvalidator.add(['tag2'])
      cacheTagInvalidator.add(['tag3'])

      const tags = getTags()
      expect(tags.size).toBe(3)
      expect(tags.has('tag1')).toBe(true)
      expect(tags.has('tag2')).toBe(true)
      expect(tags.has('tag3')).toBe(true)
    })

    it('should debounce multiple add calls', async () => {
      const invalidateSpy = vi.spyOn(cacheTagInvalidator, 'invalidate')

      cacheTagInvalidator.add(['tag1'])
      cacheTagInvalidator.add(['tag2'])

      // Advance time but not enough to trigger
      vi.advanceTimersByTime(50)
      expect(invalidateSpy).not.toHaveBeenCalled()

      cacheTagInvalidator.add(['tag3'])

      // Complete the timeout
      vi.advanceTimersByTime(100)

      expect(invalidateSpy).toHaveBeenCalledOnce()
    })
  })
})
