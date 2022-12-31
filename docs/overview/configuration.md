# Full Configuration Example

## Minimal
By default no features are enabled and no functionality is added to your Nuxt
app.

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache']
}
```

## Full example

This example uses every possible configuration option.

```typescript
import { defineNuxtConfig } from 'nuxt'
import redisDriver from 'unstorage/drivers/redis'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  // Component cache is enabled.
  component: {
    enabled: true,
    storage: {
      // Provide a custom storage driver that uses Redis as the cache backend.
      driver: redisDriver({
        base: 'storage:'
      })
    }
  },

  // Data cache enabled.
  data: {
    enabled: true,
  },

  // Route cache is disabled. But because the `route` property is set the
  // useRouteCache composable is still added to the build, it just doesn't
  // cache.
  route: {
    enabled: false,
  },

  // CDN Cache Control Headers feature.
  cdn: {
    enabled: true,

    // Set custom cache control for Cloudflare.
    cacheControlHeader: 'CDN-Cache-Control',

    // Set custom cache tags header for Cloudflare.
    cacheTagHeader: 'Cache-Tag'
  },

  // Cache Management API.
  api: {
    enabled: true,

    // Use a different prefix for the API endpoints.
    prefix: '/api/nuxt-multi-cache',

    // Use a custom method that checks authorization. Can be something like
    // cookie, basic auth or request IP.
    authorization: async function (event) {
      return await isAuthenticated(event)
    },

    // Cache tag invaldiations should be buffered for 5 minutes before the
    // cache items are actually purged.
    cacheTagInvalidationDelay: 300000 // 5 minutes
  },

  // Custom callback that decides if caching should be enabled for the current
  // request. Returning false here prevents access to the cache for the
  // duration of the request.
  enabledForRequest: async function(event) {
    const user = await getUserFromRequest(event)

    // Disabled all caching for logged in users.
    if (user.isLoggedIn) {
      return false
    }

    // Caches enabled for anonymous users.
    return true
  }
}
```

## Reference

<<< @/../src/runtime/types.ts
