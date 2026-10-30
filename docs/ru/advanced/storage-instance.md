# Использование Storage Instance

Экземпляры unstorage для всех кешей доступны во время выполнения через server util `useMultiCacheApp`.

::: info

Обратите внимание, что это всегда даст вам доступ к экземплярам хранилища, обходя [enabledForRequest](/ru/overview/server-options#disable-all-caches-per-request).

:::

```typescript
export default defineEventHandler(async (event) => {
  const multiCache = useMultiCacheApp()

  // Очистить route cache.
  await multiCache.cache.route?.storage.clear()

  // Получить все ключи элементов data cache.
  const dataCacheKeys = await app.multiCache.cache.data?.storage.getKeys()

  return {
    success: true,
  }
})
```
