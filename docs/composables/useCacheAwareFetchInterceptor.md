# useCacheAwareFetchInterceptor

Only available in **Nuxt**.

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

By using the interceptor, both the cache tags and the max age (and all other
Cache-Control values) are merged with the SSR request rendering the page.

The merging follows the same "rules" as usual: When multiple `maxAge` values are
set, the **lowest wins**. In our case, the rendered page response header would
be `Cache-Control: max-age=3600`, because that's the max age defined in the
event handler.

The same also works when using the route cache: In this case, the cache tags,
the max age and the stale if error duration of the API route are merged with the
route cache of the SSR request. A cached page then never outlives the data of
the API route it shows.
