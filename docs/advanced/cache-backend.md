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

## Cloudflare Workers

On Cloudflare Workers, the memory storage only lives as long as an isolate. Use
the [Cloudflare KV binding driver](https://unstorage.unjs.io/drivers/cloudflare)
instead:

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      storage: {
        driver: cloudflareKVBindingDriver({ binding: 'CACHE', base: 'route' }),
      },
    },
  }
})
```

:::

- **Purging by tag happens during the request.** Workers don't run timers after
  the response has been sent, so for Cloudflare presets the
  `api.cacheTagInvalidationDelay` option is ignored. If it's set, the build logs
  a warning.
- **Larger caches need a
  [cache tag registry](/overview/cache-tags#cache-tag-registry).** Without one,
  purging by tag lists all keys and reads every item. A Worker can make
  [1,000 operations](https://developers.cloudflare.com/kv/platform/limits/) to
  KV and other services per request, so this fails once the caches hold about
  1,000 items. The built-in in-memory registry doesn't work here; implement one
  with KV, D1 or a Durable Object.
- **Purged items can still be served in other locations for a while.** KV
  changes
  [may take 60 seconds or more](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
  to be visible everywhere.

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

## Cache Keys

unstorage normalizes the keys of all items:

- `/`, `\` and `:` are the same separator: `search/shoes`, `search:shoes` and
  `search::shoes` are the same key. A leading or trailing separator is removed.
- Keys with a `.` or `..` segment, such as `search:..`, are rejected with an
  error.
- Everything after a `?` would be dropped. The module therefore neither reads
  nor stores items whose key contains a `?`, so that a key such as
  `search:shoes?casino` can't replace the item of `search:shoes`. With the
  [debug](/overview/configuration) option, this is logged.

This applies to data cache keys, custom keys of the component cache and keys
returned by `buildCacheKey`. If a key contains request input, such as a query
value or a route param, validate it or use a hash of it.

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
