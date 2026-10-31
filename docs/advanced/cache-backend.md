# Cache Backend

This module uses [unstorage](https://github.com/unjs/unstorage) to handle the
cache layer. This means it's possible to use any cache backend. By default the
`memory` backend is used.

If a Nuxt app runs several instances you cannot use a memory cache anymore,
since purging a cache via the API would only affect a single instance. To solve
that you have to use an external cache backend.

## Example using Redis

This minimal example uses the
[Redis driver](https://unstorage.unjs.io/drivers/redis) provided by unstorage.
The driver requires the `ioredis` package to be installed.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import redisDriver from 'unstorage/drivers/redis'

export default defineMultiCacheOptions(() => {
  return {
    component: {
      storage: {
        driver: redisDriver({
          base: 'component:',
        }),
      },
    },
  }
})
```

:::

## Expiration

Items are stored with the `ttl` option of unstorage, so drivers that support
expiration (such as Redis) remove items once they can no longer be served:

- Items with a max age are kept until they expire, or until their
  [stale if error](/overview/stale-if-error) duration ends, if that is later.
- Items with a permanent max age or stale if error, and routes that allow
  stale-while-revalidate, are stored without a TTL. They are kept until they are
  purged.
- Items with a max age of `0` are only stored if they have a stale if error
  duration (or, for routes, allow stale-while-revalidate).

## Storage Errors

If the cache backend is not available, the route and component cache log the
error and continue without the cache. The data cache throws the error by
default. This can be changed per cache with the
[bubbleError](/overview/server-options#storage-errors) server option.

## Custom Driver

Checkout the full example on
[how to create a custom driver](https://unstorage.unjs.io/guide/custom-driver).

This example recreates the default storage (in-memory) using a `Map`.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { defineDriver } from 'unstorage'

const customDriver = defineDriver(() => {
  const cache = new Map<string, string>()
  return {
    hasItem(key) {
      return cache.has(key)
    },
    getItem(key) {
      return cache.get(key) ?? null
    },
    setItem(key, value) {
      cache.set(key, value)
    },
    removeItem(key) {
      cache.delete(key)
    },
    getKeys() {
      return [...cache.keys()]
    },
    clear() {
      cache.clear()
    },
    dispose() {},
  }
})

export default defineMultiCacheOptions(() => {
  return {
    component: {
      storage: {
        driver: customDriver(),
      },
    },
  }
})
```

:::
