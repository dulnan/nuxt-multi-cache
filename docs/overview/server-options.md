# Server Options

All dynamic configuration is located in a special runtime file located at
`~/server/multiCache.serverOptions.ts`. This file is bundled together with the
nitro build in the .output folder.

Create a file called `multiCache.serverOptions.ts` (or js/mjs) inside the
`server` folder in your Nuxt root.

::: info

In previous versions the file was located in
`~/app/multiCache.serverOptions.ts`. For future compatibility with Nuxt 4 the
path has been changed to the _server dir_, which defaults to `<root>/server`.
The legacy file location is still supported but will be removed in the next
major release.

:::

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // ...
  }
})
```

:::

## Cache Configuration

For each cache you can define custom options for the unstorage instance, for
example a custom cache driver.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import redisDriver from 'unstorage/drivers/redis'

export default defineMultiCacheOptions(() => {
  return {
    data: {
      storage: {
        driver: redisDriver({
          base: 'data:',
        }),
      },
    },

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

## Custom cache key generation for route cache

[See this section](/features/route-cache#cache-key-for-routes)

## Custom API Authorization

This method will be called for each request to the API. The function receives
the `H3Event` object as an argument and can then decide if authorization is
granted by returning a Promise that resolves to `true` or `false`.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { isAuthenticated } from './somewhere'

export default defineMultiCacheOptions(() => {
  return {
    api: {
      // Use a custom method that checks authorization. Can be something like
      // cookie, basic auth or request IP.
      authorization: async function (event) {
        return await isAuthenticated(event)
      },
    },
  }
})
```

:::

## Disable all Caches per Request

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // Custom callback that decides if caching should be enabled for the current
    // request. Returning false here prevents access to the cache for the
    // duration of the request.
    enabledForRequest: async function (event) {
      const user = await getUserFromRequest(event)

      // Disabled all caching for logged in users.
      if (user.isLoggedIn) {
        return false
      }

      // Caches enabled for anonymous users.
      return true
    },
  }
})
```

:::

## Use a global cache prefix

You can automatically prefix every cache item with a string. This will affect
all caches and is prepended to every cache key.

### Static

Pass a static string which is included in the build. A common use case is if you
use your Nuxt app to serve multiple domains but use the same cache backend (e.g.
redis).

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: 'example_com',
  }
})
```

:::

### Dynamic

Provide a method that determines the cache key prefix per request. One use case
is if your app responds differently based on the request headers, e.g.
`Accept-Language`.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { H3Event, getHeader } from 'h3'

function getCacheKeyPrefix(event: H3Event): string {
  const acceptLanguage = getHeader(event, 'accept-language') || ''

  if (acceptLanguage.includes('de')) {
    return 'de'
  }
  return 'en'
}

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: (event) => {
      return Promise.resolve(getCacheKeyPrefix(event))
    },
  }
})
```

:::
