# Cache Backend

This module uses [unstorage](https://github.com/unjs/unstorage) to handle the
cache layer. This means it's possible to use any cache backend. By default the
`memory` backend is used.

If a Nuxt app runs several instances you cannot use a memory cache anymore,
since purging a cache via the API would only affect a single instance. To solve
that you have to use an external cache backend.

## Example using Redis

This minimal example uses the [Redis
driver](https://github.com/unjs/unstorage/blob/main/src/drivers/redis.ts)
provided by unstorage.

```typescript
import { defineNuxtConfig } from 'nuxt'
import redisDriver from 'unstorage/drivers/redis'

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  component: {
    enabled: true,

    storage: {
      // Provide a custom storage driver that uses Redis as the cache backend.
      driver: redisDriver({
        base: 'storage:'
      })
    }
  }
})
```

## Custom Driver

Checkout the full example on [how to create a custom
driver](https://github.com/unjs/unstorage#making-custom-drivers).

```typescript
import { defineNuxtConfig } from 'nuxt'
import redisDriver from 'unstorage/drivers/redis'
import { defineDriver } from 'unstorage'

const customDriver = defineDriver((_opts) => {
  let cache = {}
  return {
    hasItem (key: string) {
      return !!cache[key]
    },
    getItem (key: string) {
      return cache[key]
    },
    setItem(key, value) {
      return cache[key] = value
    },
    removeItem (key) {
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

export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  component: {
    enabled: true,
    storage: {
      driver: customDriver()
    }
  }
})
```
