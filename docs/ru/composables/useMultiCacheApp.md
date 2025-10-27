# useMultiCacheApp

Доступен только в **Nitro**.

Этот server util дает вам доступ к "Multi Cache App", который содержит ссылки на экземпляры кеша.

## Пример

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

## Свойства

### cache

Объект со свойствами для каждого типа кеша и экземпляром кеша в качестве значения.

```typescript
const multiCache = useMultiCacheApp()

const routeCache = await multiCache.cache.route
const dataCache = await multiCache.cache.data
const componentCache = await multiCache.cache.component
```

### serverOptions

Опции, определенные в [multiCache.serverOptions.ts](/ru/overview/server-options).

### config

Отображенная runtime конфигурация.

### state

Управляет базовым состоянием, общим между запросами, таким как какие ключи в данный момент ревалидируются при использовании функции staleWhileRevalidate из route cache.
