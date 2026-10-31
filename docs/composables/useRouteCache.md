# useRouteCache

Available in **Nuxt** and **Nitro**.

This composable is available when the
[Route Cache feature](/features/route-cache) is enabled. It allows you to
control if and how the current request should be cached.

## Full Example

```typescript
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable().addTags(['page:1'])
})
```

## Arguments

### callback: `(cache: NuxtMultiCacheRouteCacheHelper) => void`

The callback that receives the route cache helper. The callback is only called
on the server.

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

## Methods

### setCacheable()

Calling this will set the response to be cacheable. Note that if
`setUncacheable()` was called previously then this method does nothing. That way
we can make sure that for example sensitive information from authenticated users
is never cached.

### setUncacheable()

Mark the response as uncacheable. This decision is final and can't be reverted.
Usually this is used to prevent caching sensitive information from authenticated
users or to prevent caching broken pages.

**Example:** Request to external API fails and the component can't render the
data. Prevent the page from being cached in this broken state.

```vue
<template>
  <div v-if="weather">
    <!-- Render Weather -->
  </div>
  <div v-else>
    <p>Weather is currently not available.</p>
  </div>
</template>

<script lang="ts" setup>
// Get the event before any await, so it's still available in the callback.
const event = useRequestEvent()

const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather').catch(() => {
    // Prevent the page from being cached because this component failed to
    // fetch its data.
    useRouteCache((v) => v.setUncacheable(), event)
  })
})
</script>
```

When the composable is called after an asynchronous operation (here in the
`catch()` callback), the Nuxt app context may no longer be available, so the
event has to be passed explicitly.

Alternatively you could also just reduce the max age for the page so that after
5 minutes the page is rendered again.

### setMaxAge(maxAge: MaxAge)

Set the [max age](/overview/max-age) for the cache entry. After that the page is
rendered again. The value is only set if it's lower than the current value.

When an entry expires, the route is rendered again and the response overwrites
the stale cache entry. Whether expired entries are removed from the storage
before that depends on the cache driver; see
[Expiration](/advanced/cache-backend#expiration).

### setStaleIfError(maxAge: MaxAge)

Set the "stale if error" duration for the cache entry. When set, a stale cached
route (in other words, a cache entry that would normally not be served because
it is expired) will be served if an error is thrown while the response is
generated. This applies to any error, regardless of its status code. The value
is only set if it's lower than the current value.

### allowStaleWhileRevalidate()

Allow a stale cached response to be served while a new one is being
"revalidated" (generated/rendered).

For example, if you have a page that does some external API call that takes a
lot of time, you can prevent "bombarding" that API by only doing one request at
a time. If that page becomes stale and if 10 people would request that page at
the same time, you would trigger 10 API calls. By setting
`allowStaleWhileRevalidate`, only the first request would trigger the API call
and the other 9 would receive a the stale response. Once the first request is
finished, every subsequent request would then receive the new, fresh response.

If the new response is not cached (for example because its status code is not
200 or it was marked as uncacheable), the stale response is no longer served
once the first request is finished. The next request renders the route again.

If the first request takes longer than 60 seconds, the next request renders the
route again too, instead of receiving the stale response.

### addTags(tags: string | string[])

Add cache tags for the cache entry. They can be later used to purge specific
cache items.

**Example:** You can add a cache tag based on the current page language:
`language:de`. Later on, if some translations change you can invalidate all
cached pages in German:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

The cached pages are removed after a delay. See
[Purge Tags](/features/api#purge-tags).

### Instance Properties

The helper has these properties to keep track of the state:

- `tags: string[]`
- `cacheable: boolean|null`
- `maxAge: number` (initially `-1`, which means permanent)
- `staleIfError: number|null`
- `staleWhileRevalidate: boolean|null`

While absolutely not encouraged, you can directly manipulate these values for
specific edge cases.

### Other Methods

- `setNumeric(property, value: MaxAge)` - Set `maxAge` or `staleIfError`, only
  if the value is lower than the current one.
- `isCacheable()` - Whether the response will be cached.
- `getMaxAge()`, `getStaleIfError()`, `getTags()` - Return the current values.
- `getExpires(property)` - Return the timestamp (in seconds) when `maxAge` or
  `staleIfError` expires.
- `mergeFromCacheItem(item)`, `mergeFromCacheability(cacheability)` - Merge the
  values of a cache item or another helper. Used to
  [bubble cacheability](/overview/bubble-cacheability).
