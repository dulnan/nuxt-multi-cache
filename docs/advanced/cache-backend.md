# Cache Backend

This module uses [unstorage](https://github.com/unjs/unstorage) to handle the
cache layer. This means it's possible to use any cache backend. By default the
`memory` backend is used.

If a Nuxt app runs several instances you cannot use a memory cache anymore,
since purging a cache via the API would only affect a single instance. To solve
that you have to use an external cache backend.

## Example using Redis

This minimal example uses the
[Redis driver](https://github.com/unjs/unstorage/blob/main/src/drivers/redis.ts)
provided by unstorage.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'
import redisDriver from 'unstorage/drivers/redis'

export default defineMultiCacheOptions({
  component: {
    storage: {
      driver: redisDriver({
        base: 'component:',
      }),
    },
  },
})
```

:::

## Custom Driver

Checkout the full example on
[how to create a custom driver](https://github.com/unjs/unstorage#making-custom-drivers).

This example recreates the default storage (in-memory) using a simple `cache`
object.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'
import { defineDriver } from 'unstorage'

const customDriver = defineDriver((_opts) => {
  let cache = {}
  return {
    hasItem(key: string) {
      return !!cache[key]
    },
    getItem(key: string) {
      return cache[key]
    },
    setItem(key, value) {
      return (cache[key] = value)
    },
    removeItem(key) {
      cache[key] = undefined
    },
    getKeys() {
      return Object.keys(cache)
    },
    clear() {
      cache = {}
    },
    dispose() {},
  }
})

export default defineMultiCacheOptions({
  component: {
    storage: {
      driver: customDriver(),
    },
  },
})
```

:::
