# Using Route Cache with Compression

It is possible to use the route cache together with compression, such as with
the
[h3-fast-compression](https://github.com/TimGonnet/h3-fast-compression?tab=readme-ov-file#benchmarks)
or [h3-compression](https://github.com/CodeDredd/h3-compression) library. You
may compress both Nuxt-rendered pages or responses from server handlers.

::: warning

There are differences in performance with these two libraries and using
`h3-fast-compression` is recommended. See
[this issue](https://github.com/dulnan/nuxt-multi-cache/issues/96) for more
information.

:::

However, due to the way that both this module and these libraries work, you can
not use compression **within the event handler**, for the simple reason that
your event handler is only called once when the response is stored in cache.
Afterwards the cached response is returned immediately. Of course you can still
continue to use compression in an event handler, but just not together with the
route cache.

For this reason, you have to compress responses globally, via the
[`beforeResponse` Nitro hook](https://nitro.unjs.io/guide/plugins#available-hooks).
This is the **only hook** that is guaranteed to work; using **`render:response`
will not** work, because this hook is only called on the first render of the
route.

::: info

While you can use compression from within your app like that, an alternative
approach would be to handle this directly on your web server, using
[mod_deflate for Apache](https://httpd.apache.org/docs/current/mod/mod_deflate.html)
or by setting
[`gzip on` in nginx](https://docs.nginx.com/nginx/admin-guide/web-server/compression/).

:::

## Example

### Only compress specific routes

::: code-group

```typescript [./server/plugins/compression.ts]
import { useCompression } from 'h3-fast-compression'
import { getRequestURL } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const url = getRequestURL(event)
    // Prevent some paths from being compressed.
    if (url.pathname.startsWith('/no-compression')) {
      return
    }

    await useCompression(event, response)
  })
})
```

:::

### Only compress specific content types

::: code-group

```typescript [./server/plugins/compression.ts]
import { useCompression } from 'h3-fast-compression'
import { getRequestURL } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const headerValue = getResponseHeader(event, 'content-type')
    const contentType = Array.isArray(headerValue) ? headerValue : [headerValue]
    const isApplicable = contentType.find(
      (v) => typeof v === 'string' && v.includes('text/html'),
    )
    if (isApplicable) {
      await useCompression(event, response)
    }
  })
})
```

:::
