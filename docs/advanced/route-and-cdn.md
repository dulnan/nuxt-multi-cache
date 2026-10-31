# Using both Route Cache and CDN Headers

Because each feature works independently it's possible to use the route cache
and the CDN headers feature at the same time.

::: warning

Because both features work independently, setting a max age via useRouteCache
does not affect the max age of the CDN cache control header and vice versa.

Only [bubbling cacheability](/overview/bubble-cacheability) (from cached
components, the data cache or the
[fetch interceptor](/composables/useCacheAwareFetchInterceptor)) can update both
at the same time.

:::

::: warning Route cache hits

The route cache stores all response headers, including the CDN headers. When a
route is served from the route cache, the CDN headers are the ones from when the
route was cached. The CDN max age is not calculated again, so the CDN may cache
the response for longer than the route cache item is still valid.

:::

## Example

Decide in a middleware where the page should be cached.

::: code-group

```typescript [server/middleware/caching.ts]
import { getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/blog')) {
    // Page will be cached locally in the route cache, but not on the CDN.
    useCDNHeaders((v) => v.private(), event)
    useRouteCache((v) => v.setCacheable(), event)
  } else {
    // Page will be cached on the CDN, but not in the route cache.
    useCDNHeaders((v) => v.public().setNumeric('maxAge', '1h'), event)
    useRouteCache((v) => v.setUncacheable(), event)
  }
})
```

:::

Make sure to never put pages with user-specific content (such as a dashboard) in
the route cache: The cache key only contains the path, so the page would be
served to every user.
