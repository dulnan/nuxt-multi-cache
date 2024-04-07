# Route Cache

Caches pages and responses of custom server handlers. It does so by providing a
helper via a composable that manages if a response should be cached.

## Configuration

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    route: {
      enabled: true,
    }
  }
}
```

```typescript [multiCache.serverOptions.ts]
// ~/app/multiCache.serverOptions.ts
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions({
  route: {
    storage: {
      driver: myCustomDriver(),
    },
  },
})
```

:::

### Cache key for routes

::: warning

By default query strings are **ignored**! This means that a request for
`/homepage?language=de` and `/homepage` will return the same cached response.

The reason for this decision is that there are basically infinite possibilities
to alter the query string. This would be an easy way to quickly crash the app by
putting hundres of thousands of pages into the cache.

:::

The cache key is automatically derived from the route path. e.g.
`/api/query/products?id=123` is transformed to `api:query:products`. If you want
to take the query string into account you can provide a function that can return
the cache key for a given route:

::: code-group

```typescript [multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'
import { getQuery } from 'h3'

export default defineMultiCacheOptions({
  route: {
    buildCacheKey(event) {
      const path = event.path
      // Handle specific routes that need query strings.
      if (path.startsWith('/api/query/products')) {
        const { id } = getQuery(event)
        if (id) {
          return 'api_query_products_' + id
        }
      }

      // Remove query string from path.
      return path.split('?')[0]
    },
  },
})
```

:::

With that all the following requests will be only handled initially and then
served from cache by the cached item `api_query_products_1`:

- /api/query/products?id=123
- /api/query/products?id=123&foobar=456
- /api/query/products?foobar=456&id=123
- /api/query/products?foobar=456&id=123&whatever=string&does=not&matter=at-all

### Alter which headers that are cached

You can define a method that receives the headers of the response and returns
the altered headers. The method is called right before the response is written
to cache.

::: warning

By default all headers are stored in the cache, because it is assumed that your
app already makes sure to not mark a response as cacheable during rendering. You
can however alter the headers that are stored in the cache. Keep in mind that
this might introduce side effects: If you use `useCookie()` to set a cookie and
then remove the `Set-Cookie` header using this approach, only the first request
will actually receive the `Set-Cookie` header. All subsequent requests that are
served from cache won't have this header.

:::

::: code-group

```typescript [multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'

export default defineMultiCacheOptions({
  route: {
    alterCachedHeaders(headers) {
      headers['set-cookie'] = undefined
      return headers
    },
  },
})
```

:::

## Usage in Components

Use the `useRouteCache` composable in a page, layout or any component:

```vue
<template>
  <div>This page is cached for 1 hour.</div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable().addTags(['page:1'])
})
</script>
```

By default a page is not cached, you have to explicitly call `setCacheable()`.

You can use the composable multiple times during a request. The exposed helper
methods make sure that there are no race conditions.

Note that calling the composable does not return a value. You only have access
to the `helper` via the callback. The reason is that this allows the compiler to
completely remove this code from client bundles.

## Usage in Server Handlers

The composable is not imported automatically and you have to provide the
`H3Event` object as the second argument:

```typescript
import { useRouteCache } from '#nuxt-multi-cache/composables'

const getResult = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: 'I am very delayed.' })
    }, 1000)
  })
}

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)
  return getResult()
})
```

The initial response will take 1 second and afterwards the response is served
from cache.

## Usage in Other Places

As long as you have access to the current request event you can import the
composable and use it with the event as the second argument.

## Route Cache Helper

The `useRouteCache` composable provides a helper to manage the cacheability of
the current request.

### setCacheable()

Calling this will set the response to be cacheable. Note that if
`setUncacheable()` was called previously then this method does nothing. That way
we can make sure that for example sensitive information from authenticated users
is never cached.

### setUncacheable()

Mark the response as uncacheable. This decision is final and can't be reverted.
Usually this is used to prevent caching sensitive information from authenticated
users or to prevent caching broken pages.

**Example:** Request to external API fails and the component can't render the
data. Prevent the page from being cached in this broken state.

```vue
<template>
  <div v-if="weather">
    <!-- Render Weather -->
  </div>
  <div v-else>
    <p>Weather is currently not available.</p>
  </div>
</template>

<script lang="ts" setup>
const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather').catch(() => {
    // Prevent the page from being cached because this component failed to
    // fetch its data.
    useRouteCache((v) => v.setUncacheable())
  })
})
</script>
```

Alternatively you could also just reduce the max age for the page so that after
5 minutes the page is rendered again.

### setMaxAge(maxAge: number)

Set the max age for the cache entry. After that the page is rendered again.

Note that cache entries remain in cache after they expired. When they expire the
route is rendered again and the response overwrites the stale cache entry.

### addTags(tags: string[])

Add cache tags for the cache entry. They can be later used to purge specific
cache items.

**Example:** You can add a cache tag based on the current page language:
`language:de`. Later on, if some translations change you can invalidate all
cached pages in German:

```bash
curl -X POST -i -H "Content-Type: application/json" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

### Instance Properties

The helper has three properties to keep track of the state:

- `tags: string[]`
- `cacheable: boolean|null`
- `maxAge: number|null`

While absolutely not encouraged, you can directly manipulate these values for
specific edge cases.
