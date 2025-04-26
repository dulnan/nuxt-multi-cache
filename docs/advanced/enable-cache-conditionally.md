# Enable Caching Conditionally

If you want you can define a method that decides for each request if caching
should be enabled. This method is executed at the earliest possible stage,
before any other caching features are executed.

::: info

This only affects the component, data and route caches. The CDN Cache Control
feature continues to work.

:::

## Configuration

::: code-group

```typescript [./server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions({
  // Custom callback that decides if caching should be enabled for the current
  // request. Returning false here prevents access to the cache for the
  // duration of the request.
  enabledForRequest: async function (event) {
    const user = await getUserFromRequest(event)

    // Disabled all caching for logged in users.
    if (user.isLoggedIn) {
      return false
    }

    // Caches enabled for anonymous users.
    return true
  },
})
```
