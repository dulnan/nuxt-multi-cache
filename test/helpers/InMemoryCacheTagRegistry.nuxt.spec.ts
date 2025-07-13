import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryCacheTagRegistry } from '~/src/runtime/helpers/InMemoryCacheTagRegistry'

describe('InMemoryCacheTagRegistry', () => {
  let registry: InMemoryCacheTagRegistry

  beforeEach(() => {
    registry = new InMemoryCacheTagRegistry()
  })

  describe('addCacheTags', () => {
    it('should add tags to a cache item', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
    })

    it('should add tags to multiple cache types', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1'])
      await registry.addCacheTags('key2', 'data', ['tag1'])
      await registry.addCacheTags('key3', 'component', ['tag1'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
      expect(result.data).toEqual(['key2'])
      expect(result.component).toEqual(['key3'])
    })

    it('should handle adding multiple tags to the same key', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2', 'tag3'])

      const result1 = await registry.getCacheKeysForTags(['tag1'])
      const result2 = await registry.getCacheKeysForTags(['tag2'])
      const result3 = await registry.getCacheKeysForTags(['tag3'])

      expect(result1.route).toEqual(['key1'])
      expect(result2.route).toEqual(['key1'])
      expect(result3.route).toEqual(['key1'])
    })

    it('should handle adding the same tag to multiple keys', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1'])
      await registry.addCacheTags('key2', 'route', ['tag1'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toContain('key1')
      expect(result.route).toContain('key2')
      expect(result.route).toHaveLength(2)
    })

    it('should handle adding duplicate tags to the same key', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1'])
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
    })

    it('should handle empty tags array', async () => {
      await registry.addCacheTags('key1', 'route', [])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toBeUndefined()
    })
  })

  describe('getCacheKeysForTags', () => {
    beforeEach(async () => {
      await registry.addCacheTags('route-key1', 'route', ['tag1', 'tag2'])
      await registry.addCacheTags('route-key2', 'route', ['tag2', 'tag3'])
      await registry.addCacheTags('data-key1', 'data', ['tag1', 'tag3'])
      await registry.addCacheTags('component-key1', 'component', ['tag2'])
    })

    it('should return keys for a single tag', async () => {
      const result = await registry.getCacheKeysForTags(['tag1'])

      expect(result.route).toEqual(['route-key1'])
      expect(result.data).toEqual(['data-key1'])
      expect(result.component).toBeUndefined()
    })

    it('should return keys for multiple tags', async () => {
      const result = await registry.getCacheKeysForTags(['tag1', 'tag2'])

      expect(result.route).toContain('route-key1')
      expect(result.route).toContain('route-key2')
      expect(result.data).toEqual(['data-key1'])
      expect(result.component).toEqual(['component-key1'])
    })

    it('should return empty result for non-existent tags', async () => {
      const result = await registry.getCacheKeysForTags(['non-existent-tag'])

      expect(result.route).toBeUndefined()
      expect(result.data).toBeUndefined()
      expect(result.component).toBeUndefined()
    })

    it('should handle empty tags array', async () => {
      const result = await registry.getCacheKeysForTags([])

      expect(result.route).toBeUndefined()
      expect(result.data).toBeUndefined()
      expect(result.component).toBeUndefined()
    })

    it('should deduplicate keys when multiple tags point to the same key', async () => {
      const result = await registry.getCacheKeysForTags(['tag1', 'tag2'])

      expect(result.route).toEqual(['route-key1', 'route-key2'])
      expect(result.route?.filter((key) => key === 'route-key1')).toHaveLength(
        1,
      )
    })
  })

  describe('removeTags', () => {
    beforeEach(async () => {
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2'])
      await registry.addCacheTags('key2', 'route', ['tag2', 'tag3'])
      await registry.addCacheTags('key3', 'data', ['tag1'])
    })

    it('should remove a single tag', async () => {
      await registry.removeTags(['tag1'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toBeUndefined()
      expect(result.data).toBeUndefined()

      // Other tags should still exist.
      const result2 = await registry.getCacheKeysForTags(['tag2'])
      expect(result2.route).toContain('key1')
      expect(result2.route).toContain('key2')
    })

    it('should remove multiple tags', async () => {
      await registry.removeTags(['tag1', 'tag2'])

      const result1 = await registry.getCacheKeysForTags(['tag1'])
      const result2 = await registry.getCacheKeysForTags(['tag2'])

      expect(result1.route).toBeUndefined()
      expect(result2.route).toBeUndefined()

      // tag3 should still exist.
      const result3 = await registry.getCacheKeysForTags(['tag3'])
      expect(result3.route).toEqual(['key2'])
    })

    it('should clean up empty key entries when all tags are removed', async () => {
      await registry.addCacheTags('lonely-key', 'route', ['lonely-tag'])
      await registry.removeTags(['lonely-tag'])

      const result = await registry.getCacheKeysForTags(['lonely-tag'])
      expect(result.route).toBeUndefined()
    })

    it('should handle removing non-existent tags', async () => {
      await registry.removeTags(['non-existent-tag'])

      // Original data should still be intact.
      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
      expect(result.data).toEqual(['key3'])
    })

    it('should handle empty tags array', async () => {
      await registry.removeTags([])

      // Original data should still be correct.
      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
      expect(result.data).toEqual(['key3'])
    })
  })

  describe('purgeCache', () => {
    beforeEach(async () => {
      await registry.addCacheTags('route-key', 'route', ['tag1'])
      await registry.addCacheTags('data-key', 'data', ['tag1'])
      await registry.addCacheTags('component-key', 'component', ['tag1'])
    })

    it('should purge only the specified cache type', async () => {
      await registry.purgeCache('route')

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toBeUndefined()
      expect(result.data).toEqual(['data-key'])
      expect(result.component).toEqual(['component-key'])
    })

    it('should purge data cache type', async () => {
      await registry.purgeCache('data')

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['route-key'])
      expect(result.data).toBeUndefined()
      expect(result.component).toEqual(['component-key'])
    })

    it('should purge component cache type', async () => {
      await registry.purgeCache('component')

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['route-key'])
      expect(result.data).toEqual(['data-key'])
      expect(result.component).toBeUndefined()
    })
  })

  describe('purgeEverything', () => {
    beforeEach(async () => {
      await registry.addCacheTags('route-key', 'route', ['tag1'])
      await registry.addCacheTags('data-key', 'data', ['tag2'])
      await registry.addCacheTags('component-key', 'component', ['tag3'])
    })

    it('should purge all cache types', async () => {
      await registry.purgeEverything()

      const result1 = await registry.getCacheKeysForTags(['tag1'])
      const result2 = await registry.getCacheKeysForTags(['tag2'])
      const result3 = await registry.getCacheKeysForTags(['tag3'])

      expect(result1.route).toBeUndefined()
      expect(result2.data).toBeUndefined()
      expect(result3.component).toBeUndefined()
    })

    it('should work on empty registry', async () => {
      const emptyRegistry = new InMemoryCacheTagRegistry()

      await expect(emptyRegistry.purgeEverything()).resolves.not.toThrow()
    })
  })

  describe('removeCacheItem', () => {
    beforeEach(async () => {
      // route keys
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2'])
      await registry.addCacheTags('key2', 'route', ['tag2', 'tag3'])
      // data keys
      await registry.addCacheTags('data1', 'data', ['tagA'])
    })

    it('should remove all tags for the specified cache item', async () => {
      // remove key1 from route
      await registry.removeCacheItem('route', 'key1')

      // tag1 was only on key1, so should be gone
      const afterTag1 = await registry.getCacheKeysForTags(['tag1'])
      expect(afterTag1.route).toBeUndefined()

      // tag2 was on key1 and key2, so after removing key1 only key2 remains
      const afterTag2 = await registry.getCacheKeysForTags(['tag2'])
      expect(afterTag2.route).toEqual(['key2'])
    })

    it('should clean up tags entirely if the removed item was the last holder', async () => {
      // data1 has only tagA
      await registry.removeCacheItem('data', 'data1')

      // tagA should no longer map to anything
      const result = await registry.getCacheKeysForTags(['tagA'])
      expect(result.data).toBeUndefined()
    })

    it('should not affect other cache types when removing an item', async () => {
      // remove a route item
      await registry.removeCacheItem('route', 'key2')

      // route tag3 should be gone
      const routeRes = await registry.getCacheKeysForTags(['tag3'])
      expect(routeRes.route).toBeUndefined()

      // data tagA should still exist
      const dataRes = await registry.getCacheKeysForTags(['tagA'])
      expect(dataRes.data).toEqual(['data1'])
    })

    it('should handle removing a non-existent key gracefully', async () => {
      // no error thrown
      await expect(
        registry.removeCacheItem('route', 'no-such-key'),
      ).resolves.not.toThrow()

      // existing tags are untouched
      const res1 = await registry.getCacheKeysForTags(['tag1'])
      expect(res1.route).toEqual(['key1'])
      const res2 = await registry.getCacheKeysForTags(['tagA'])
      expect(res2.data).toEqual(['data1'])
    })

    it('should allow re-adding tags to a removed key', async () => {
      await registry.removeCacheItem('route', 'key1')
      // now re-add same tags
      await registry.addCacheTags('key1', 'route', ['tag1', 'tag2'])

      const result = await registry.getCacheKeysForTags(['tag1', 'tag2'])
      expect(result.route).toContain('key1')
    })
  })

  describe('integration tests', () => {
    it('should handle complex scenarios with multiple operations', async () => {
      await registry.addCacheTags('user-1', 'route', ['user', 'profile'])
      await registry.addCacheTags('user-2', 'route', ['user', 'settings'])
      await registry.addCacheTags('posts-1', 'data', ['user', 'posts'])
      await registry.addCacheTags('nav', 'component', ['user'])

      // Verify the initial state.
      let result = await registry.getCacheKeysForTags(['user'])
      expect(result.route).toHaveLength(2)
      expect(result.data).toEqual(['posts-1'])
      expect(result.component).toEqual(['nav'])

      // Remove the 'user' tag.
      await registry.removeTags(['user'])

      result = await registry.getCacheKeysForTags(['user'])
      expect(result.route).toBeUndefined()
      expect(result.data).toBeUndefined()
      expect(result.component).toBeUndefined()

      // The other tags should still work.
      result = await registry.getCacheKeysForTags(['profile'])
      expect(result.route).toEqual(['user-1'])

      result = await registry.getCacheKeysForTags(['settings'])
      expect(result.route).toEqual(['user-2'])
    })

    it('should handle adding and removing the same tags multiple times', async () => {
      await registry.addCacheTags('key1', 'route', ['tag1'])
      await registry.removeTags(['tag1'])
      await registry.addCacheTags('key1', 'route', ['tag1'])

      const result = await registry.getCacheKeysForTags(['tag1'])
      expect(result.route).toEqual(['key1'])
    })
  })
})
