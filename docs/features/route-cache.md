# Route Cache

Caches pages and responses of custom server handlers. It does so by providing a
helper via a composable that manages if a response should be cached.

Unlike built-in Nitro caching, you can decide at runtime whether or not a route
should be cached, for how long, etc.. Any `routeRules` or
`defineCachedEventHandler` are ignored by this module (but they still work if
you wish to use both at the same time).

Only responses to `GET` and `HEAD` requests with a non-empty body are stored, by
default only with a status code of `200` (see [Status codes](#status-codes)).

## Configuration

::: code-group

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    route: {
      enabled: true,
    },
  },
})
```

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      storage: {
        driver: myCustomDriver(),
      },
    },
  }
})
```

:::

### Status codes

By default only responses with the status code `200` are stored. To store
others, list all status codes to store:

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    route: {
      enabled: true,
      statusCodes: [200, 301, 302, 307, 308],
    },
  },
})
```

A stored response is served with its status code and headers. With redirect
status codes, the redirects of `navigateTo()` during server side rendering are
stored too, including their `Location` header. The redirect must only depend on
what the [cache key](#cache-key-for-routes) contains. By default the key is the
path without the query, so a redirect that keeps the query of the request in its
target would send every visitor to the target of the first one. Use
[`alterCachedHeaders`](#alter-which-headers-are-cached) or a custom cache key in
that case.

Responses that a server handler sends itself, e.g. with `sendRedirect`, are
never stored.

### Cache key for routes

::: warning

By default query strings are **ignored**! This means that a request for
`/homepage?language=de` and `/homepage` will return the same cached response.

The reason for this decision is that there are basically infinite possibilities
to alter the query string. This would be an easy way to quickly crash the app by
putting hundreds of thousands of pages into the cache.

:::

The cache key is automatically derived from the route path. e.g.
`/api/query/products?id=123` is transformed to `api:query:products`. If you want
to take the query string into account you can provide a function that can return
the cache key for a given route:

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { getQuery, getRequestURL } from 'h3'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      buildCacheKey(event) {
        const url = getRequestURL(event)

        // The path (without query string).
        const path = url.pathname

        // Handle specific routes that need query strings.
        if (path.startsWith('/api/query/products')) {
          const { id } = getQuery(event)
          if (id) {
            return 'api_query_products_' + id
          }
        }

        return path
      },
    },
  }
})
```

:::

With that all the following requests will be only handled initially and then
served from cache by the cached item `api_query_products_123`:

- /api/query/products?id=123
- /api/query/products?id=123&foobar=456
- /api/query/products?foobar=456&id=123
- /api/query/products?foobar=456&id=123&whatever=string&does=not&matter=at-all

The global cache prefix is not added to the key returned by `buildCacheKey` (see
[Use a global cache prefix](/overview/server-options#use-a-global-cache-prefix)).
The storage normalizes the key, and keys with a `?` are not cached at all (see
[Cache Keys](/advanced/cache-backend#cache-keys)).

The root path `/` is stored with the key `{root}`, because the storage
normalizes `/` to an empty key, which it doesn't allow. The same applies if
`buildCacheKey` returns such a key. With a global cache prefix, the root path is
stored as `<prefix>--`.

### Alter which headers are cached

You can define a method that receives the headers of the response and returns
the altered headers. The method is called right before the response is written
to cache.

::: warning

By default all headers are stored in the cache (except `Content-Encoding`,
because the body is stored uncompressed), because it is assumed that your app
already makes sure to not mark a response as uncacheable during rendering if it
contains sensitive headers such as Set-Cookie for authentication. You can
however alter the headers that are stored in the cache. Keep in mind that this
might introduce side effects: If you use `useCookie()` to set a cookie and then
remove the `Set-Cookie` header using this approach, only the first request will
actually receive the `Set-Cookie` header. All subsequent requests that are
served from cache won't have this header.

The reason for this behaviour is that for nuxt-multi-cache there is no way to
know if a header contains sensitive information or not. For example, a
`Set-Cookie` header might contain a harmless cookie to set the current country,
which one might actually want to cache.

If you wish to prevent caching a route that contains a `Set-Cookie` in the first
place, you should make sure to mark the route as uncacheable at this point, for
example right after calling `useCookie`.

:::

::: code-group

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      alterCachedHeaders(headers) {
        // Remove any set-cookie header from being cached.
        headers['set-cookie'] = undefined

        // Or perform more granular checks, such as checking what kind of cookie it is.
        return headers
      },
    },
  }
})
```

:::

### Cache-Status header

The module can add a
[`Cache-Status` header (RFC 9211)](https://www.rfc-editor.org/rfc/rfc9211.html)
to responses that says how the route cache handled the request:

::: code-group

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    route: {
      enabled: true,
      // `true` uses the name "nuxt-multi-cache", a string sets another name.
      cacheStatus: true,
    },
  },
})
```

:::

It can also be enabled or disabled at runtime, see
[Runtime Config](/overview/runtime-config#cache-status-header).

| The response                                                                                                                         | Cache-Status                                           |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Served from the route cache                                                                                                          | `nuxt-multi-cache; hit; ttl=376`                       |
| Served stale while another request renders it again ([stale while revalidate](/composables/useRouteCache#allowstalewhilerevalidate)) | `nuxt-multi-cache; hit; ttl=-12`                       |
| Rendered, nothing was stored                                                                                                         | `nuxt-multi-cache; fwd=uri-miss`                       |
| Rendered, the stored route is expired                                                                                                | `nuxt-multi-cache; fwd=stale`                          |
| Rendered, the stored route could not be loaded                                                                                       | `nuxt-multi-cache; fwd=miss`                           |
| The stored route, because rendering failed with a server error ([stale-if-error](/overview/stale-if-error))                          | `nuxt-multi-cache; fwd=stale; fwd-status=503; ttl=-60` |
| Rendered without the route cache: excluded by `route.applies`, `enabledForRequest` or the module                                     | `nuxt-multi-cache; fwd=bypass`                         |
| Rendered without the route cache: a method other than `GET` and `HEAD`                                                               | `nuxt-multi-cache; fwd=method`                         |

A rendered response that is stored also gets `stored` and the `ttl` of the
stored route, e.g. `nuxt-multi-cache; fwd=uri-miss; ttl=3600; stored`. If
writing it to the storage fails, the error is logged. The `ttl` is the time in
seconds until the route expires. It's 0 or negative if the response is stale (0
for a max age of 0), and missing if the route has no max age. Error responses
get the entry of the request that failed, e.g. `fwd=uri-miss` for a 404 page.

Responses that a server handler sends itself, e.g. with `sendStream`,
`sendRedirect` or `proxyRequest`, don't get an entry. They are never stored
either.

If the response already has a `Cache-Status` header, for example from an API
whose response is proxied, the entry is added after it. The entry is never
stored with the route. A CDN that caches the response keeps the entry and adds
its own after it, so the entry then describes the response when it was rendered.

The header is sent to every visitor, like the cache status headers of CDNs. It
doesn't include the cache key or the cache tags. To find the key of a route, use
the debug log (`debug: true`), then
[inspect it with the API](/features/api#inspect).

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

The server util is imported automatically, but you have to provide the `H3Event`
object as the second argument:

```typescript
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

See [useRouteCache](/composables/useRouteCache).

## Difference to Nitro Cache

Nitro (and by proxy also Nuxt) already ships with a route cache feature using
either [`routeRules`](https://v2.nitro.build/config#routerules) or
[`defineCachedEventHandler`](https://v2.nitro.build/guide/cache#cached-event-handlers).
However, it is more targeted towards simple use cases.

### Missing features

#### No cacheability decided during rendering

Nitro decides whether a response is cached before the handler runs: With the
options of the handler or the route rules, or per request with
`shouldBypassCache`. It's not possible to change this based on what happens
while the response is rendered, for example to only cache a page if all of its
data could be loaded.

When using nuxt-multi-cache route cache, you can decide at any given moment
during the duration of your request whether or not the response should be
cached, for how long, what its cache tags are, etc. You can also implement
what's called a "kill switch", for example if a backend request fails during
SSR, you can mark the response as uncacheable, after which it's impossible to
mark it as cacheable again.

#### No cache purging

While it supports a max age / TTL, there is no built-in way to purge individual
cache items using keys or cache tags.

#### No cache tags

There is no concept of cache tags, so purging has to be done either by purging
everything or based on key (e.g. wildcard matching, `/products/*`).

#### Global overrides

There is no easy way to define global overrides, such as a global cache key
prefix, disabling caching completely for the duration of the request, etc.

### Should you use nuxt-multi-cache?

If your needs are covered by the built-in Nitro caching, then you should
probably not use nuxt-multi-cache route cache, because it introduces an
additional layer of complexity that is only warranted if you actually need the
additional features.

### Using both caches together

It is technically possible to use both Nitro cache and nuxt-multi-cache route
cache at the same time, because they work quite differently:

- Nitro decides on a per event handler basis whether or not it can be cached
  when using `defineCachedEventHandler` or by checking the `routeRules`.
- This module instead hooks into the request lifecycle: In the `request` hook,
  it decides whether the route cache applies to the request (see
  [applies](/overview/server-options#applies); it never applies to an ambiguous
  path such as `//contact`). If it does, an event handler at the start of the
  handler stack serves cached responses before any other event handler is
  executed. When the `afterResponse` hook is called, it puts the response in
  cache. And when an error becomes the response, its Nitro error handler serves
  a stale response if one is available (see
  [Stale if Error](/overview/stale-if-error#route-cache)).
