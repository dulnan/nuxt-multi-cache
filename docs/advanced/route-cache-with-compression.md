# Using Route Cache with Compression

It is possible to use the route cache together with compression, such as with
the [h3-compression](https://github.com/CodeDredd/h3-compression) library. You
may compress both Nuxt-rendered pages or responses from server handlers.

However, due to the way that both this module and the `h3-compression` library
work, you can not use compression **within the event handler**, for the simple
reason that your event handler is only called once when the response is stored
in cache. Afterwards the cached response is returned immediately. Of course you
can still continue to use compression in an event handler, but just not together
with the route cache.

For this reason, you have to compress responses globally, via the
[`beforeResponse` Nitro hook](https://nitro.unjs.io/guide/plugins#available-hooks).
This is the only hook that is guaranteed to work; using `render:response` **will
not** work, because this hook is only called on the first render of the page.

::: info

While you can use compression from within your app like that, an alternative
approach would be to handle this directly on your web server, using
[mod_deflate for Apache](https://httpd.apache.org/docs/current/mod/mod_deflate.html)
or by setting
[`gzip on` in nginx](https://docs.nginx.com/nginx/admin-guide/web-server/compression/).

:::

## Example

::: code-group

```typescript [./server/plugins/compression.ts]
import { useCompression } from 'h3-compression'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    // Prevent some paths from being compressed.
    if (event.path.startsWith('/no-compression')) {
      return
    }

    await useCompression(event, response)
  })
})
```

:::
