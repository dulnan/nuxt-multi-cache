---
name: nuxt-multi-cache
description: "Caching in Nuxt apps with nuxt-multi-cache: route cache, component cache (<RenderCacheable>), data cache (useDataCache, useCachedAsyncData), CDN headers (useCDNHeaders), cache tags and the purge API. Use when adding, changing, reviewing or debugging caching with this module: a page or component that should or must not be cached, stale or wrong content, or a page that isn't cached."
license: MIT
---

# nuxt-multi-cache

The API is in the module's types and in the docs at
https://nuxt-multi-cache.dulnan.net. This skill holds the decisions and rules
that keep a cache from serving one request's content to another.

## Setup

- **`nuxt.config`:** a feature is added when its key exists in `multiCache`
  (`route`, `component`, `data`, `cdn`, `api`) and enabled with
  `enabled: true`. Runtime config can turn added features on and off; the API
  can only be turned off.
  [Configuration](https://nuxt-multi-cache.dulnan.net/overview/configuration#adding-and-enabling-features)
- **`server/multiCache.serverOptions.ts`:** everything that isn't serializable,
  with `defineMultiCacheOptions` from `nuxt-multi-cache/server-options`:
  storage drivers, `route.buildCacheKey`, `route.applies`,
  `route.alterCachedHeaders`, `enabledForRequest`, `cacheKeyPrefix`, the API
  authorization callback.
  [Server options](https://nuxt-multi-cache.dulnan.net/overview/server-options)
- **Storage:** without a driver, every cache is in memory, per server process.
  It's empty after a restart, and with several instances each has its own
  cache, so a purge request only reaches one of them. Deployments with more
  than one instance need a shared driver such as Redis. A persistent driver
  keeps items across deploys: purge the route and component caches on each
  deploy, because cached pages point to the asset files of the previous build.
  [Cache backend](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend)

## Which cache

| Job                                                               | Use                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A whole page or API response, the same for everyone with that URL | Route cache: `useRouteCache((route) => route.setCacheable())`; in server handlers, pass the `event` |
| A part of a page that's expensive and the same for many requests  | Component cache: `<RenderCacheable>`, see [component cache](references/component-cache.md)          |
| Data from a slow API or an expensive computation                  | Data cache: `useDataCacheCallback`, `useDataCache`, or `useCachedAsyncData` in components           |
| Caching in a CDN or proxy in front of the app                     | CDN headers: `useCDNHeaders`, see [CDN headers](references/cdn.md)                                  |

The caches combine: a route-cached page can contain cached components and data.
The route cache and the CDN headers keep separate values; a max age set for one
doesn't apply to the other.

## Rules

Every cached item is **shared**: one render serves everyone who gets the same
key. Each rule protects that.

1. **Cache only what is the same for everyone with the same key.** A page that
   calls `setCacheable()` is served to every visitor of that path, including its
   cookies and the user's data it rendered. Where user-specific content is
   rendered, call `setUncacheable()`. To skip the module's caches for logged in
   users, return `false` from `enabledForRequest` when the session cookie is
   present. Neither changes the CDN headers: mark these responses with
   `cdn.private()` as well.
2. **Mark request-specific responses with `setUncacheable()`, not a max age of 0.** With stale-if-error or stale-while-revalidate, a max age of 0 still
   stores a stale copy that can be served. `setUncacheable()` is final: nothing
   can make the item cacheable again.
   [Max age 0](https://nuxt-multi-cache.dulnan.net/overview/max-age#max-age-0)
3. **Make the key vary with everything the output depends on.** Route keys are
   the path; the query string is ignored by default. Content that depends on a
   query value, the language or the currency needs `route.buildCacheKey` or a
   `cacheKeyPrefix`. `buildCacheKey` replaces the whole route key, so it has to
   include what the prefix would add. Build keys from validated values of known
   parameters, never the raw query, and without a `?`: the storage drops
   everything after it.
   [Cache keys](https://nuxt-multi-cache.dulnan.net/advanced/cache-backend#cache-keys)
4. **`enabledForRequest` and `cacheKeyPrefix` run before server middleware.**
   Values a middleware puts on `event.context` (such as the current user) aren't
   set yet. Read cookies and headers directly.
   [When it runs](https://nuxt-multi-cache.dulnan.net/overview/server-options#when-it-runs)
5. **A cached route stores its response headers, including `Set-Cookie`.** Mark
   the route uncacheable where a response sets a cookie for one visitor, or
   remove the header with `route.alterCachedHeaders`.
6. **A cached component renders once.** Inside `<RenderCacheable>`, the
   component can't read the route, cookies or global state; pass what it needs
   as props. Read [component cache](references/component-cache.md) before adding
   or reviewing one.
7. **Bubble the cacheability of the parts.** With `bubbleCacheability` on
   `useDataCache`, `useDataCacheCallback` and `<RenderCacheable>`, a page gets
   the lowest max age and all cache tags of its parts, and becomes uncacheable
   if a part is. Without it, a page outlives its data and isn't purged by the
   data's tags. `useCachedAsyncData` doesn't bubble; where the page needs it,
   call `useDataCacheCallback` inside `useAsyncData`. Bubbling never makes a page
   cacheable; the page still calls `setCacheable()`.
   [Bubbling](https://nuxt-multi-cache.dulnan.net/overview/bubble-cacheability)
8. **Fetch the app's own API routes with relative URLs** through
   `useCacheAwareFetchInterceptor`, so their cache tags, max age and
   uncacheability bubble into the page. An API route only sends these values if
   it calls `useRouteCache(cb, event)` itself: a page that fetches per-user data
   from an API route without it has to mark itself uncacheable. Absolute URLs
   only merge the CDN headers.

## Max age

- The lowest value wins, across repeated calls and bubbled parts.
- `'permanent'` (or `-1`) means no limit and never lowers another value.
- `0` (or `'never'`) means "not served fresh". Other negative numbers and `NaN`
  mean the same.
- Numbers are seconds. Strings name durations (`'5m'`, `'1h'`, `'1d'`) or points
  in time (`'midnight'`, `'next-hour'`).
  [Max age](https://nuxt-multi-cache.dulnan.net/overview/max-age)

## Purging

- **Tag** every item with the source of its content (`article:123`,
  `navigation`): `addTags()` on the route and CDN helpers, `cache-tags` on
  `<RenderCacheable>`, the tags argument of `addToCache()`. Bubbling carries
  them up to the page.
- **Purge** through the API, e.g. from a CMS webhook:
  `POST /__nuxt_multi_cache/purge/tags` with a JSON array of tags and the
  `x-nuxt-multi-cache-token` header. Tags are collected for
  `api.cacheTagInvalidationDelay` (60000 ms by default) before items are
  removed. The module only sends the tags to the CDN; purge the CDN through its
  own API.
  [API](https://nuxt-multi-cache.dulnan.net/features/api)
- **Protect the API:** set the token with
  `NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN`. `api.authorization: false` is only
  for servers whose API isn't reachable from outside.

## Check that it works

1. Set `debug: true` in the module options. The server logs
   `Storing route in cache` and `Serving cached route for path` for the route
   cache.
2. Build and start the app (`nuxt build`, `node .output/server/index.mjs`).
3. Request each changed page twice. The second response comes from the cache:
   the log says so, or a timestamp rendered on the page stays the same. Read the
   CDN headers with `curl -sI`.
4. For everything that must not be shared, request it as a second visitor
   (other cookies, other language) and compare: the second response has none of
   the first visitor's content.
5. List what is stored: `GET /__nuxt_multi_cache/stats/route` (or `component`,
   `data`) with the token header, if the API is enabled.

Done when every cached part you changed was seen stored and served from the
cache, and every part that must not be shared was seen not stored.

When something isn't cached, or a cache serves stale or wrong content, go
through [troubleshooting](references/troubleshooting.md).
