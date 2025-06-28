# Using the Storage Instance

The unstorage instances for all caches are available at runtime via the
`useMultiCacheApp` server util.

::: info

Note that this will always give you access to the storage instances, bypassing
[enabledForRequest](/overview/server-options#disable-all-caches-per-request).

:::

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
