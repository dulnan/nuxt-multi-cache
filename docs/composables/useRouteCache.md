# useRouteCache

This composable is available when the
[Route Cache feature](/features/route-cache) is enabled. It allows you to
control if and how the current request should be cached.

## Full Example

```typescript
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable().addTags(['page:1'])
})
```

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
const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather').catch(() => {
    // Prevent the page from being cached because this component failed to
    // fetch its data.
    useRouteCache((v) => v.setUncacheable())
  })
})
</script>
```

Alternatively you could also just reduce the max age for the page so that after
5 minutes the page is rendered again.

### setMaxAge(maxAge: number)

Set the max age for the cache entry. After that the page is rendered again.

Note that cache entries remain in cache after they expired. When they expire the
route is rendered again and the response overwrites the stale cache entry.

### addTags(tags: string[])

Add cache tags for the cache entry. They can be later used to purge specific
cache items.

**Example:** You can add a cache tag based on the current page language:
`language:de`. Later on, if some translations change you can invalidate all
cached pages in German:

```bash
curl -X POST -i -H "Content-Type: application/json" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

### Instance Properties

The helper has three properties to keep track of the state:

- `tags: string[]`
- `cacheable: boolean|null`
- `maxAge: number|null`

While absolutely not encouraged, you can directly manipulate these values for
specific edge cases.
