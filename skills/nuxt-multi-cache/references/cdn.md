# CDN headers

The CDN feature only sets response headers that a CDN or proxy reads. It
doesn't cache anything itself and keeps its own values, separate from the route
cache. [Docs](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control)

## Headers

- The defaults, `Surrogate-Control` and `Cache-Tag`, don't match a single CDN.
  Set `cdn.cacheControlHeader` and `cdn.cacheTagHeader` for the CDN in use.
  [Common headers](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#common-headers)
- With `Cache-Control` as the CDN header, browsers get the same values as the
  CDN.

## Setting values

- In pages and components: `useCDNHeaders((cdn) => ...)`. In server handlers,
  pass the `event` as the second argument.
- `cdn.public()`, `cdn.private()`, `cdn.setNumeric('maxAge', '1h')`,
  `setNumeric('sharedMaxAge' | 'staleIfError' | 'staleWhileRevalidate', ...)`,
  `setBoolean('noStore')`, `addTags([...])`.
- The lowest max age wins. `'permanent'` doesn't set or lower a directive.

## Private responses

- `private()` or `no-store` in the CDN header also adds `private` to
  `Cache-Control`, because some CDNs (Fastly) ignore both in their own header.
  An existing `Cache-Control` set by the app is merged; `public` is removed.
  [Private responses](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control#private-responses)
- A `Cache-Control` header set in your own `beforeResponse` hook, or written
  directly to `event.node.res`, needs `private` from your code.

## Merging

- `s-maxage` is the lifetime for shared caches. If the page or a merged
  response sets one, the header gets the lowest of all sources (their
  `s-maxage`, or their `max-age` without one).
- API routes fetched with `useCacheAwareFetchInterceptor` merge their CDN
  values into the page, except `public` and custom directives. Other fetches
  merge with `cdn.mergeFromResponse(response)` in their `onResponse` hook.
- Data cache items and `<RenderCacheable>` merge with `bubbleCacheability`
  (`true` or `'cdn'`). An uncacheable part sets `max-age=0, no-store`.

## Purging

The module only sends the cache tags. Purge the CDN with its own API, using the
same tags as the purge requests to the module.

## Checking

The CDN usually removes its header before the response reaches the browser.
Check the headers at the origin, e.g. `curl -sI http://localhost:3000/page`, and
look for the CDN header, the cache tag header and `Cache-Control`.
