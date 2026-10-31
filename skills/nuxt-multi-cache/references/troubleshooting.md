# Troubleshooting

Turn on `debug: true` first: the server logs what is stored and served, and
why some items are skipped (no component name, a key with a `?`).

## A page or API route isn't cached

Check in this order; the first match is usually the cause.

1. **The feature is off.** The route cache needs `route` in the module options
   and `enabled: true` (or `NUXT_MULTI_CACHE_ROUTE=true`). Without any feature
   enabled at build time, the module's server plugin isn't added at all.
2. **Nothing marks it cacheable.** A page calls
   `useRouteCache((route) => route.setCacheable())` during server rendering
   (in `setup`, a plugin or route middleware), not in `onMounted`. A server
   handler passes the `event`.
3. **The response doesn't qualify.** Only `GET` and `HEAD` requests with status
   200 and a non-empty body are stored.
4. **Something made it uncacheable:** `setUncacheable()` anywhere in the
   request, a bubbled uncacheable data cache item or component, an API route
   fetched through the interceptor, or a max age of 0 without stale-if-error.
5. **The path is excluded:** `route.applies` returns `false`; without a custom
   `applies`, the path ends in a common asset extension (`.js`, `.css`,
   `.html`, `.png`, `.svg`, fonts); it's below the module API, Nuxt's build
   assets or the error page; or it has `//`, `\` or `.`/`..` segments.
6. **`enabledForRequest` returns `false`**, e.g. because the test request sends
   a session cookie.
7. **The key has a `?`**, from a custom `route.buildCacheKey`.
8. **Another instance answered.** With the default memory storage, each server
   process has its own cache.

## A component isn't cached

- The first child of `<RenderCacheable>` isn't a component with a name.
- Its child gets slot content, or the slot is forwarded, and there's no
  `cache-key`.
- `no-cache` is set on it, or on a `<RenderCacheable>` nested in it.
- The `cache-key` contains a `?`.

## Data isn't cached

- The max age is `0`, `'never'`, negative or `NaN`.
- `setUncacheable()` was called in the `useDataCacheCallback` callback.
- `useCachedAsyncData` has no `serverMaxAge`, or its function returned
  `undefined`.
- The key contains a `?`.

## Content is stale

- **Long max ages without cache tags** can only be purged by key or all at
  once. Tag items with the source of their content.
- **Purging by tag waits** for `api.cacheTagInvalidationDelay` (60000 ms by
  default).
- **The purge reached one instance** of several, with the memory storage.
- **The page outlives its data** because the data cache items and components
  don't set `bubbleCacheability`.
- **The CDN keeps its own copy**, which the module doesn't purge.
- **The client keeps a copy:** `clientMaxAge` of `useCachedAsyncData` caches on
  the client during navigation.
- **A stale copy is served on purpose:** stale-if-error for server errors, or
  stale-while-revalidate while one request renders the new version.
- **Items survived a deploy** in a persistent storage. Cached pages then point to
  the asset files of the previous build. Purge the route and component caches
  on each deploy.

## Another visitor's or variant's content is served

- **The key ignores what the content depends on.** Route keys ignore the query
  string; the language, currency or a query value needs `route.buildCacheKey`
  or a `cacheKeyPrefix`. A `buildCacheKey` replaces the whole route key,
  including the prefix.
- **User-specific content was rendered into a cacheable page**, or into a cached
  component. Call `setUncacheable()` on the route (`no-cache` only skips the
  component cache) and `cdn.private()`, or skip the module's caches for logged
  in users with `enabledForRequest`.
- **An API route with per-user data** was fetched through the interceptor but
  doesn't call `useRouteCache(cb, event)`, so nothing marked the page
  uncacheable.
- **A cached component reads the route, cookies or global state** instead of
  props, so its key doesn't change with them.
- **A `cache-key` doesn't cover the slot content** of the child or of a
  forwarded slot.
- **`cacheKeyPrefix` or `enabledForRequest` read `event.context`**, which server
  middleware hasn't set yet when they run.
- **A `Set-Cookie` header was stored** with the route and is sent to everyone.
- **The CDN caches a personalized response.** Mark it with `private()`.
