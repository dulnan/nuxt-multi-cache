# Using the Storage Instance

The cache storage singleton is not exported directly, but you can access it
from the current request event. The singleton is only attached if the caches
are enabled.

```typescript
export default defineEventHandler(async (event) => {
  const multiCache = event.context.__MULTI_CACHE

  await multiCache.component.clear()
  await data = multiCache.data.getItem('foobar')

  return {
    success: true
  }
})
```

