![nuxt-multi-cache banner](./docs/public/banner.jpg?raw=true 'nuxt-multi-cache for Nuxt 3')

# Nuxt Multi Cache for Nuxt 3

This module provides several layers of server-side caching for your Nuxt 3 app:

- SSR component caching (caches rendered markup of a component)
- Route caching (pages, API routes)
- Data Caching (generic cache for anything)
- CDN cache control headers (e.g. Cloudflare, Fastly, Varnish)
- API for cache management
- Cache tag based invalidation

**[Documentation](https://nuxt-multi-cache.dulnan.net)** -
**[NPM](https://www.npmjs.com/package/nuxt-multi-cache)**

## Nuxt 2

[Version 1.x](https://github.com/dulnan/nuxt-multi-cache/tree/1.x) (which is in
maintenance mode) supports Nuxt 2.

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

# Features

## Component caching

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

## Route caching

Cache rendered pages or custom API responses:

```vue
<script lang="ts" setup>
useRouteCache((route) => {
  // Mark the page as cacheable for 1 hour and add a cache tag.
  route.setCacheable().setMaxAge(3600).addTags(['page:2'])
})
</script>
```

## CDN cache control headers

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

## API

The optional API provides endpoints to manage the caches.
