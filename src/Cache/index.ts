export interface CacheEntries {
  total: number
  rows: any[]
}

export interface CachePurgeResult {
  success: boolean
  purged?: number
}

export interface Cache {
  /**
   * Add a cache entry.
   */
  set(key: string, data: string, tags?: string[]): Promise<boolean>

  /**
   * Get a cache entry for a key.
   */
  get(key: string, cb?: (res: string) => void): Promise<any>|void

  /**
   * Check if a cache entry for the key exists.
   */
  has(key: string, cb?: (hit: boolean) => void): void|Promise<boolean>

  /**
   * Get all entries, optionally paginated.
   */
  getEntries(offset?: number): Promise<CacheEntries>

  /**
   * Get the count for a tag.
   * Indicated how many entries have this tag.
   */
  getCountForTag(tag: string): Promise<number>

  /**
   * Purge entries for the given tags.
   */
  purgeTags(tags: string[]): Promise<CachePurgeResult>

  /**
   * Purge entries by keys.
   */
  purgeKeys(keys: string[]): Promise<CachePurgeResult>

  /**
   * Purge the entire cache.
   */
  purgeAll(): Promise<CachePurgeResult>

  /**
   * Get all tags used in this cache.
   */
  getTags(): Promise<any[]>
}

export interface RouteCache {
  set(route: string, data: string, tags?: string[]): Promise<boolean>
}
