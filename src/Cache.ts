/**
 * In-memory cache.
 *
 * Routes are cached by their route name (path) and optionally by tags.
 * It's possible to purge a single route or purge all routes containing certain
 * tags.
 */
export default class Cache {
  /**
   * The map where the cached routes are stored.
   */
  cache: Map<string, any>

  /**
   * Map of routes belonging to a tag.
   */
  tagRoutes: Map<string, string[]>

  /**
   * Map of tags belonging to a route.
   */
  routeTags: Map<string, string[]>

  constructor() {
    this.cache = new Map()
    this.tagRoutes = new Map()
    this.routeTags = new Map()
  }

  getStats() {
    return new Promise((resolve, reject) => {
      try {
        resolve({
          cachedRoutes: Array.from(this.cache.keys()),
          tagRoutes: Object.fromEntries(this.tagRoutes.entries()),
          routeTags: Object.fromEntries(this.routeTags.entries()),
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Get a route from the cache.
   */
  get(key: string): Promise<string | void> {
    return new Promise((resolve, reject) => {
      try {
        const cached = this.cache.get(key)
        if (cached) {
          return resolve(cached)
        }

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Add a route to the cache.
   */
  set(route: string, tags: string[], data: string): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      try {
        this.cache.set(route, data)

        if (!this.routeTags.has(route)) {
          this.routeTags.set(route, [])
        }

        tags.forEach((tag) => {
          if (!this.tagRoutes.has(tag)) {
            this.tagRoutes.set(tag, [])
          }

          this.tagRoutes.get(tag)?.push(route)
          this.routeTags.get(route)?.push(tag)
        })
        resolve(true)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Purge a single route.
   */
  purgeRoutes(routes: string[] = []): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      try {
        routes.forEach((route) => {
          // Immediately delete entry in cache.
          this.cache.delete(route)

          // Get the tags of this route.
          const tags = this.routeTags.get(route) || []

          // Filter out the route from the tagRoutes map.
          tags.forEach((tag) => {
            if (this.tagRoutes.has(tag)) {
              const routes = this.tagRoutes.get(tag) || []
              this.tagRoutes.set(
                tag,
                routes.filter((v) => v !== route)
              )
            }
          })

          // Remove the route entry.
          this.routeTags.delete(route)
        })
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Purge by tags.
   */
  purgeTags(tags: string[] = []): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      try {
        const routesToPurge: string[] = []

        tags.forEach((tag) => {
          const routes = this.tagRoutes.get(tag) || []
          routesToPurge.push(...routes)

          this.tagRoutes.set(tag, [])
        })

        routesToPurge.forEach((route) => {
          this.routeTags.set(route, [])
          this.cache.delete(route)
        })

        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Purge a single tag.
   */
  purgeTag(tag: string): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      try {
        this.purgeTags([tag])
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Purge everything.
   */
  purgeAll(): Promise<boolean | Error> {
    return new Promise((resolve, reject) => {
      try {
        this.cache.clear()
        this.tagRoutes.clear()
        this.routeTags.clear()
        resolve(true)
      } catch (e) {
        reject(e)
      }
    })
  }
}
