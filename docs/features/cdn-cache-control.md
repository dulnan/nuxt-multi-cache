# CDN Cache Headers

Services like Cloudflare, Fastly, Akamai or Varnish use special headers to
control the cacheability of responses. Often these are different from the
Cache-Control values meant for browsers. This feature provides an easy way to
manage these headers during the execution of the request.

## Configuration

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    cdn: {
      /**
      * Enable the CDN headers feature.
      */
      enabled: true,

      /**
      * The header to use for the cache-control settings.
      */
      cacheControlHeader: 'CDN-Cache-Control',

      /**
      * The header to use for the cache tags header.
      */
      cacheTagHeader: 'Cache-Tag'
    }
  }
}
```

### Common Headers

| Service                                                                                   | cacheControlHeader  | cacheTagHeader   |
| ----------------------------------------------------------------------------------------- | ------------------- | ---------------- |
| [**Fastly**](https://docs.fastly.com/en/guides/controlling-caching)                       | `Surrogate-Control` | `Surrogate-Key`  |
| [**Cloudflare**](https://developers.cloudflare.com/cache/about/cdn-cache-control/)        | `CDN-Cache-Control` | `Cache-Tag`      |
| [**Akamai**](https://techdocs.akamai.com/property-mgr/docs/know-caching)                  | `Edge-Control`      | `Edge-Cache-Tag` |
| [**nginx**](https://www.nginx.com/blog/nginx-caching-guide/)                              | `Cache-Control`\*   | _unsupported_    |
| [**varnish**](https://www.varnish-software.com/developers/tutorials/http-caching-basics/) | `Cache-Control`\*   | `X-Cache-Tags`   |

**\* This header will clash with the cache control header meant for browsers.
With varnish you could use a custom header like `X-Cache-Control` and then
handle that in a custom VCL.**

## Usage in pages / components

Use the [`useCDNHeaders`](/composables/useCDNHeaders) composable in your
components to set properties for the CDN headers:

```vue
<template>
  <div>This page has special CDN cache control headers.</div>
</template>

<script lang="ts" setup>
useCDNHeaders((helper) => {
  helper
    .addTags(['one', 'two'])
    .public()
    .setNumeric('maxAge', 21600)
    .setNumeric('staleIfError', 43200)
})
</script>
```

This will set the following headers on the response:

```
Cache-Tag: one two
Surrogate-Control: max-age=21600, public, stale-if-error=43200
```

You can use the composable multiple times across many components in a request.
This is useful if you generally want to cache pages for a long time (like 7
days), but reduce the max age for certain components. For example, a page that
shows the current weather should only be cached for a maximum of 1 hour. You
could then set the max age inside the `Weather` component:

```vue
<template>
  <div>
    <!-- Render Weather -->
  </div>
</template>

<script lang="ts" setup>
const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather')
})

useCDNHeaders((v) => v.setNumeric('maxAge', 3600))
</script>
```

This will override the `maxAge` value to 3600. `setNumeric` is a special method
that only overrides the value if it is lower than the current value.

Now everytime this component is used on a page it will make sure that the
response will be cached for a maximum of 1 hour, even if the page containing the
component defined a max age of 7 days.

## Usage in Server Handlers

You can use the same composable in your server handlers, but it is not imported
automatically. In addition you have to provide the H3Event object as the second
argument:

```typescript
import { useCDNHeaders } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper
      .public()
      .setNumeric('maxAge', 3600)
      .set('staleIfError', 24000)
      .set('staleWhileRevalidate', 60000)
      .set('mustRevalidate', true)
      .addTags(['api'])
  }, event)

  return {
    api: 'This response should have CDN headers.',
  }
})
```

## Usage in Other Places

The state of the CDN header values is stored in the current request, so as long
as you have access to the event you can use the composable anywhere you like.
