# Enable Caching Conditionally

If you want you can define a method that decides for each request if caching
should be enabled. This method is executed at the earliest possible stage,
before any other caching features are executed.

It can run before any server middleware, so it may only depend on the request
itself, such as headers or cookies. Values that a middleware puts on
`event.context` aren't set yet. See
[When It Runs](/overview/server-options#when-it-runs).

::: info

This only affects the component, data and route caches. The CDN Cache Control
feature continues to work.

:::

## Configuration

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { getCookie } from 'h3'

export default defineMultiCacheOptions(() => {
  return {
    // Custom callback that decides if caching should be enabled for the current
    // request. Returning false here prevents access to the cache for the
    // duration of the request.
    enabledForRequest: async function (event) {
      // Disable all caching for requests with a session, e.g. logged in
      // users. Checks the request itself, not values set by a middleware.
      return !getCookie(event, 'session')
    },
  }
})
```
