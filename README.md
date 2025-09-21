![nuxt-multi-cache banner](./docs/public/banner.jpg?raw=true 'nuxt-multi-cache for Nuxt')

# Nuxt Multi Cache

This module provides several layers of server-side caching for your Nuxt app:

- SSR component caching (caches rendered markup of a component)
- Route caching (pages, API routes)
- Data Caching (generic cache for anything)
- CDN cache control headers (e.g. Cloudflare, Fastly, Varnish)
- API for cache management
- Cache tag based invalidation

**[Documentation](https://nuxt-multi-cache.dulnan.net)** -
**[NPM](https://www.npmjs.com/package/nuxt-multi-cache)**

It is compatible with Nuxt 3 and Nuxt 4.

## Features

### [Data Cache](https://nuxt-multi-cache.dulnan.net/features/data-cache)

Cache data directly in your Nuxt app or Nitro event handlers using
`useDataCache`:

```typescript
const { value, addToCache } = await useDataCache<WeatherResponse>('weather')
if (value) {
  return value
}

const response = await $fetch<WeatherResponse>('/api/getWeather')
await addToCache(response)

return response
```

### [Component Cache](https://nuxt-multi-cache.dulnan.net/features/component-cache)

Use the `<RenderCacheable>` wrapper component to cache the markup of the default
slot:

```vue
<template>
  <div>
    <RenderCacheable cache-key="navbar_de" :max-age="3600">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

The component is only rendered once and its markup cached. Afterwards the markup
is directly returned.

### [Route Cache](https://nuxt-multi-cache.dulnan.net/features/route-cache)

Cache rendered pages or custom API responses:

```vue
<script lang="ts" setup>
useRouteCache((route) => {
  // Mark the page as cacheable for 1 hour and add a cache tag.
  route.setCacheable().setMaxAge(3600).addTags(['page:2'])
})
</script>
```

### [CDN Cache Control Headers](https://nuxt-multi-cache.dulnan.net/features/cdn-cache-control)

Manage the cacheability for the current response. This will set the correct
cache control and cache tags headers for Cloudflare, Fastly and other cache
providers:

```vue
<script lang="ts" setup>
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 3600)
    .setNumeric('staleWhileRevalidate', 21600)
    .set('mustRevalidate', true)
    .addTags(['page:2', 'image:342'])
})
</script>
```

The state is managed inside the current request and can be changed for the
entire duration of the request. The headers are generated right before the
response is sent.

### [API](https://nuxt-multi-cache.dulnan.net/features/api)

The optional API provides endpoints to manage the caches.

```bash [curl]
curl -X POST -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

## Why?

Does your Nuxt app serve thousands of pages from a CMS? Does it have tens of
thousands of requests per day? Does the data change frequently? Does rendering a
single page require fetching data from multiple APIs? If you've answered any of
these questions with "yes", then this module might be for you.

I work fulltime on building frontends with Nuxt for large CMS sites. Rendering a
single page might require up to 10 API calls to get all the data: Menu, footer,
translations, route, page data, user state, additional data... It all adds up
and doing that for every request can quickly become a bottleneck. Maybe you can
work around this problem by getting all the data in a single API call, but I
didn't like to have components dependent on global state.

Instead my solution was to cache the API responses locally on the server. Either
for a fixed amount of time, like 5 minutes, or until the cache entry is being
invalidated. In addition, I cache components that appear on most pages, like
menu or footer.

The hardest thing in IT is cache invalidation, so I also added a way to
invalidate cache entries by key or using cache tags.
