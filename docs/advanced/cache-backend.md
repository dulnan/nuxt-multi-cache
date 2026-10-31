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

## Custom Driver

Checkout the full example on
[how to create a custom driver](https://github.com/unjs/unstorage#making-custom-drivers).

This example recreates the default storage (in-memory) using a simple `cache`
object.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
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
