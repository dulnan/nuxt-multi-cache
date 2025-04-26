# Using both Route Cache and CDN Headers

Because each feature works independently it's possible to use the route cache
and the CDN headers feature at the same time.

::: warning

Because both features work independently, setting a max age via useRouteCache
does not affect the max age of the CDN cache control header and vice versa.

:::

## Example

Decide in a middleware where the page should be cached.

```typescript
import { useCDNHeaders } from '#imports'
import { getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/dashboard')) {
    // Page will be cached locally in the route cache.
    useCDNHeaders((v) => v.private())
    useRouteCache((v) => v.setCacheable())
  } else {
    // Page will be cached on CDN.
    useCDNHeaders((v) => v.public())
    useRouteCache((v) => v.setUncacheable())
  }
})
```
