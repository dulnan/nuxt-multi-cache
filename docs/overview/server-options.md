# Server Options

All dynamic configuration is located in a special runtime file located at
`server/multiCache.serverOptions.ts`. This file is bundled together with the
nitro build in the .output folder.

Create a file called `multiCache.serverOptions.ts` (or `.js`/`.mts`) inside the
`server` folder in your Nuxt root.

::: info

In previous versions the file was located in
`<root>/app/multiCache.serverOptions.ts`. It must now be placed in the _server
dir_, which defaults to `<root>/server`. If the file is only found in a previous
location, Nuxt stops with an error that shows where to move it.

:::

::: code-group

```typescript [server/multiCache.serverOptions.ts]
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

```typescript [server/multiCache.serverOptions.ts]
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

### Storage Errors

Each cache has a `bubbleError` option that decides what happens if the storage
fails, for example because Redis is not reachable:

- `true` - The error is thrown, so it can be handled by your code or results in
  an error response.
- `false` - The error is logged and the request continues without the cache.

The default is `true` for the data cache and `false` for the route and component
cache.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    data: {
      // Log storage errors instead of throwing them.
      bubbleError: false,
    },
  }
})
```

:::

## Route Cache Options

The route cache has additional options:

- `buildCacheKey` - Build a custom cache key for a route. See
  [Cache Key for Routes](/features/route-cache#cache-key-for-routes).
- `alterCachedHeaders` - Change which headers are stored. See
  [Alter which headers are cached](/features/route-cache#alter-which-headers-are-cached).
- `applies` - Decide which paths can be cached at all.

### applies

The method receives the path of the request (including the query string) and
returns whether the route cache is used for it. If the method returns `false`,
the route isn't looked up in the route cache and its response isn't stored.

By default, paths that end in one of these file extensions are excluded, also if
they have a query string: `ico`, `png`, `jpg`, `js`, `css`, `html`, `woff`,
`woff2`, `ttf`, `otf`, `eot`, `svg`. Providing a method replaces this default.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      // Only cache routes below /blog.
      applies: (path) => path.startsWith('/blog'),
    },
  }
})
```

:::

Nuxt's build assets (`/_nuxt`), the error page and the module's
[API](/features/api) are always excluded, regardless of this option.

## Custom API Authorization

This method will be called for each request to the API if no token is set (via
the `api.authorization` module option or runtime config) and authorization is
not disabled. So leave out the `api.authorization` module option in this case.

The function receives the `H3Event` object as an argument and can then decide if
authorization is granted by returning a Promise that resolves to `true` or
`false`.

::: code-group

```typescript [server/multiCache.serverOptions.ts]
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

```typescript [server/multiCache.serverOptions.ts]
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
all caches: The key is stored as `<prefix>--<key>`.

The prefix is not added to the keys of routes if you provide your own
[buildCacheKey](/features/route-cache#cache-key-for-routes) method.

When using the [API](/features/api) to purge or inspect single items, the key
must include the prefix.

### Static

Pass a static string which is included in the build. A common use case is if you
use your Nuxt app to serve multiple domains but use the same cache backend (e.g.
redis).

::: code-group

```typescript [server/multiCache.serverOptions.ts]
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

```typescript [server/multiCache.serverOptions.ts]
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
