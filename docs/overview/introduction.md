---
title: Introduction
editLink: true
---

# Introduction

nuxt-multi-cache is the ultimate caching module for Nuxt 3. It greatly improves
performance for Nuxt apps that have a lot of dynamic content (think of large
CMS sites or user generted content). But even if you just have a few dozen
pages you can increase average performance.

- Several cache backends (memory, redis, Cloudflare KV) via [unstorage](https://github.com/unjs/unstorage)
- Fully modular, pick whatever you need
- Minimal impact on client side bundle and performance
- Works in SSR (server-side rendering) and SSG (static site generation)
- Large test coverage

## Setup

### Step 1: Install

Install the module using your preferred package manager.

```sh
npm install --save nuxt-multi-cache
```

### Step 2: Configure

Add the module to your Nuxt config.

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],
})
```

By default the module does not enable a single feature, you have to manually
define which you'd like to use.

## [Component Cache](/features/componentCache)

Cache rendered markup of components on the server. Ideal for complex, deeply
nested components like menu or footer.

```vue
<template>
  <div>
    <RenderCacheable>
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

## [Route Cache](/features/routeCache)

Dynamically cache pages and API routes.

```typescript
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable()
})
```

## [Data Cache](/features/dataCache)

Generic cache for anything that can be stringified.

```typescript
const { value, addToCache } = await useDataCache('weather')
```

## [CDN Cache Control](/features/cdnCacheControl)

Dynamically set `Cache-Control` and `Cache-Tag` headers for Cloudflare, Fastly
and other services.

```typescript
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 21600)
    .setNumeric('staleIfError', 43200)
    .addTags(['one', 'two'])
})
```
