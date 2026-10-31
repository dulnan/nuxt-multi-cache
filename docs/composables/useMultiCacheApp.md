# useMultiCacheApp

Only available in **Nitro**.

This server util gives you access to the "Multi Cache App" that contains
references to the cache instances.

It returns `undefined` if all features and the API are disabled in the module
options, because the module's server plugin is not added in this case.

## Example

```typescript
export default defineEventHandler(async (event) => {
  const multiCache = useMultiCacheApp()

  // Clear the route cache.
  await multiCache?.cache.route?.storage.clear()

  // Get all data cache item keys.
  const dataCacheKeys = await multiCache?.cache.data?.storage.getKeys()

  return {
    success: true,
  }
})
```

## Properties

### cache

An object with a property for every enabled cache. Each contains the unstorage
instance (`storage`) and the
[bubbleError](/overview/server-options#storage-errors) setting of the cache.

```typescript
const multiCache = useMultiCacheApp()

const routeCache = multiCache?.cache.route
const dataCache = multiCache?.cache.data
const componentCache = multiCache?.cache.component
```

### serverOptions

The options defined in [multiCache.serverOptions.ts](/overview/server-options).

### config

The mapped runtime config.

### state

Manages basic state shared between requests, such as which keys are currently
being revalidated when using the staleWhileRevalidate feature from the route
cache.

### cacheTagRegistry

The [cache tag registry](/overview/cache-tags#cache-tag-registry) from the
server options, or `null` if none is configured.

### cacheTagInvalidator

Collects cache tags and purges the items with these tags once the
[delay](/features/api#purge-tags) has passed. This is what the purge tags API
endpoint uses.

```typescript
const multiCache = useMultiCacheApp()

// Purge all items with the tag after the configured delay.
multiCache?.cacheTagInvalidator.add(['language:de'])
```
