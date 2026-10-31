# Using the Storage Instance

The unstorage instances for all caches are available at runtime via the
`useMultiCacheApp` server util.

::: info

Note that this will always give you access to the storage instances, bypassing
[enabledForRequest](/overview/server-options#disable-all-caches-per-request).

:::

::: warning

If you use a [cache tag registry](/overview/cache-tags#cache-tag-registry),
changing a storage directly does not update the registry. Unlike the
[purge API](/features/api), clearing a storage leaves the tags of its items in
the registry. Call the registry's `purgeCache()` method in this case:

```typescript
await multiCache?.cache.route?.storage.clear()
await multiCache?.cacheTagRegistry?.purgeCache('route')
```

:::

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
