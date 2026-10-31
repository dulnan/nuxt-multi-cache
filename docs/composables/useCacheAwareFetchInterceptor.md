# useCacheAwareFetchInterceptor

Only available in **Nuxt**. The composable is available if the
[CDN feature](/features/cdn-cache-control) or the
[route cache](/features/route-cache) is added in the module config.

This composable returns an object with `onRequest` and `onResponse` fetch
interceptors. This allows you to bubble cacheability of
[CDN Cache Control](/features/cdn-cache-control) and
[Route Cache](/features/route-cache) to the current request.

```typescript
const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch('/api/load-users', interceptor)
```

## Arguments

### bubbleCacheability?: `BubbleCacheability`

Which cacheability of the API route to bubble. Defaults to `true`.

- `true` - Bubble to the route cache and the CDN headers
- `'route'` - Only bubble to the route cache
- `'cdn'` - Only bubble to the CDN headers
- `false` - Don't bubble

```typescript
const { data } = await useFetch(
  '/api/load-users',
  useCacheAwareFetchInterceptor('cdn'),
)
```

See [Bubbling Cacheability](/overview/bubble-cacheability) for details.

## Full example

Let's assume you have an API route at `/api/load-users` that loads some users.
The event handler adds specific cacheability for this route:

```typescript
export default defineEventHandler(async (event) => {
  useCDNHeaders((helper) => {
    helper.addTags(['user-list']).setNumeric('maxAge', '1h')
  }, event)

  return loadUsers()
})
```

It adds the `user-list` cache tag and defines a max age of **1 hour**.

Then, on the page that fetches the users from your API route:

```vue
<script lang="ts" setup>
const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch('/api/load-users', interceptor)

useCDNHeaders((cdn) => {
  cdn.addTags(['page-users']).setNumeric('maxAge', '7d')
})
</script>
```

By using the interceptor, both the cache tags and the max age are merged with
the SSR request rendering the page. This also includes the other numeric and
boolean directives and `private`, but not `public` or
[custom directives](/composables/useCDNHeaders#addcustomdirective-name-string-value-string-number-true).

The merging follows the same "rules" as usual: When multiple `maxAge` values are
set, the **lowest wins**. In our case, the rendered page response header would
be `Surrogate-Control: max-age=3600` (with the default header name), because
that's the max age defined in the event handler.

The same also works when the API route uses the route cache: In this case, the
cache tags, the max age and the stale if error duration of the API route are
merged with the route cache of the SSR request. A cached page then never
outlives the data of the API route it shows. If the API route is marked as
uncacheable, the page becomes uncacheable as well.

## Relative URLs Only

The route cache values are only bubbled from requests to relative URLs, such as
`/api/load-users`, which Nitro handles in the same process. The interceptor
marks them as internal requests with a random token that changes whenever the
server starts. Requests to absolute URLs leave the app, even if they point to
it, so they neither get the token nor bubble route cache values. Their CDN
headers are still merged.
