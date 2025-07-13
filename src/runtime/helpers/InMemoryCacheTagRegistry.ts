import type { CacheType } from '../types'
import type { CacheTagRegistry } from '../types/CacheTagRegistry'

const CACHE_TYPES: CacheType[] = ['route', 'data', 'component']

export class InMemoryCacheTagRegistry implements CacheTagRegistry {
  private tagToKeys = new Map<CacheType, Map<string, Set<string>>>(
    CACHE_TYPES.map((type) => [type, new Map()]),
  )

  private keyToTags = new Map<CacheType, Map<string, Set<string>>>(
    CACHE_TYPES.map((type) => [type, new Map()]),
  )

  getCacheKeysForTags(
    tags: string[],
  ): Promise<Partial<Record<CacheType, string[]>>> {
    const result: Partial<Record<CacheType, string[]>> = {}

    for (const cacheType of CACHE_TYPES) {
      const keysSet = new Set<string>()
      const tagMap = this.tagToKeys.get(cacheType)!
      for (const tag of tags) {
        const keys = tagMap.get(tag)
        if (keys) {
          for (const key of keys) {
            keysSet.add(key)
          }
        }
      }
      if (keysSet.size) {
        result[cacheType] = Array.from(keysSet)
      }
    }

    return Promise.resolve(result)
  }

  removeTags(tags: string[]): Promise<void> {
    for (const cacheType of CACHE_TYPES) {
      const tagMap = this.tagToKeys.get(cacheType)!
      const keyMap = this.keyToTags.get(cacheType)!
      for (const tag of tags) {
        const keys = tagMap.get(tag)
        if (!keys) {
          continue
        }
        for (const key of keys) {
          const keyTags = keyMap.get(key)!
          keyTags.delete(tag)
          if (!keyTags.size) {
            keyMap.delete(key)
          }
        }
        tagMap.delete(tag)
      }
    }
    return Promise.resolve()
  }

  purgeCache(cacheType: CacheType): Promise<void> {
    this.tagToKeys.get(cacheType)!.clear()
    this.keyToTags.get(cacheType)!.clear()
    return Promise.resolve()
  }

  removeCacheItem(cacheType: CacheType, key: string | string[]): Promise<void> {
    const tagMap = this.tagToKeys.get(cacheType)!
    const keyMap = this.keyToTags.get(cacheType)!
    const keysToRemove = Array.isArray(key) ? key : [key]
    for (const key of keysToRemove) {
      const keyTags = keyMap.get(key)
      if (!keyTags) {
        return Promise.resolve()
      }

      for (const tag of keyTags) {
        const tagKeys = tagMap.get(tag)!
        tagKeys.delete(key)
        if (!tagKeys.size) {
          tagMap.delete(tag)
        }
      }
      keyMap.delete(key)
    }
    return Promise.resolve()
  }

  purgeEverything(): Promise<void> {
    for (const cacheType of CACHE_TYPES) {
      this.tagToKeys.get(cacheType)!.clear()
      this.keyToTags.get(cacheType)!.clear()
    }
    return Promise.resolve()
  }

  addCacheTags(
    cacheItemKey: string,
    cacheType: CacheType,
    cacheTags: string[],
  ): Promise<void> {
    const tagMap = this.tagToKeys.get(cacheType)!
    const keyMap = this.keyToTags.get(cacheType)!

    let keyTags = keyMap.get(cacheItemKey)
    if (!keyTags) {
      keyTags = new Set()
      keyMap.set(cacheItemKey, keyTags)
    }

    for (const tag of cacheTags) {
      keyTags.add(tag)
      let tagKeys = tagMap.get(tag)
      if (!tagKeys) {
        tagKeys = new Set()
        tagMap.set(tag, tagKeys)
      }
      tagKeys.add(cacheItemKey)
    }

    return Promise.resolve()
  }
}
