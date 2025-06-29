# useMultiCacheApp

Only available in **Nitro**.

This server util gives you access to the "Multi Cache App" that contains
references to the cache instances.

## Example

```typescript
export default defineEventHandler(async (event) => {
  const multiCache = useMultiCacheApp()

  // Clear the route cache.
  await multiCache.cache.route?.storage.clear()

  // Get all data cache item keys.
  const dataCacheKeys = await app.multiCache.cache.data?.storage.getKeys()

  return {
    success: true,
  }
})
```

## Properties

### cache

An object with properties for every cache type and the cache instance as the
value.

```typescript
const multiCache = useMultiCacheApp()

const routeCache = await multiCache.cache.route
const dataCache = await multiCache.cache.data
const componentCache = await multiCache.cache.component
```

### serverOptions

The options defined in [multiCache.serverOptions.ts](/overview/server-options).

### config

The mapped runtime config.

### state

Manages basic state shared between requests, such as which keys are currently
being revalidated when using the staleWhileRevalidate feature from the route
cache.
