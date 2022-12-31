# Nuxt Multi Cache

Ultimate caching for Nuxt 3.

- SSR component caching (caches rendered markup of a component)
- Route caching (pages, API routes)
- Data Caching (generic cache for anything)
- CDN cache control headers (e.g. Cloudflare, Fastly, Varnish)
- API for cache management
- Cache tag based invalidation

**[Documentation](https://nuxt-multi-cache.dulnan.net)** - **[NPM](https://www.npmjs.com/package/nuxt-multi-cache)**

# Features

## Component caching

Use the `<RenderCacheable>` wrapper component to cache the markup of the
default slot:

```vue
<template>
  <div>
    <RenderCacheable cache-key="navbar_de" :max-age="3600">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

The component is only rendered once and its markup cached. Afterwards the
markup is directly returned.

## Route caching

Cache rendered pages or custom API responses:

```vue
<script lang="ts" setup>
useRouteCache((route) => {
  // Mark the page as cacheable for 1 hour and add a cache tag.
  route
    .setCacheable()
    .setMaxAge(3600)
    .addTags(['page:2'])
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

