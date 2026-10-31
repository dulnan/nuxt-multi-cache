# Bubbling Cacheability

A page is often built from several cached parts: Data from the
[data cache](/features/data-cache), cached components and API routes that are
fetched during SSR. Each part has its own max age and cache tags.

By _bubbling_ the cacheability of these parts, their max age, stale if error
duration and cache tags are merged into the [route cache](/features/route-cache)
and/or the [CDN headers](/features/cdn-cache-control) of the current request.
This way, a cached page never outlives the data it shows, and purging a cache
tag also purges the pages that use it.

## Values

Bubbling is set with a `bubbleCacheability` option, which accepts:

- `true` - Bubble to the route cache and the CDN headers
- `'route'` - Only bubble to the route cache
- `'cdn'` - Only bubble to the CDN headers
- `false` - Don't bubble

Bubbling only has an effect if the route cache or the CDN feature is enabled.

## What Bubbles

| Value          | Route cache                   | CDN headers                                     |
| -------------- | ----------------------------- | ----------------------------------------------- |
| Max age        | Lowest value wins             | `max-age`, lowest value wins, caps `s-maxage`   |
| Stale if error | Lowest value wins, except `0` | `stale-if-error`, lowest value wins, except `0` |
| Cache tags     | Added                         | Added to the cache tag header                   |
| Uncacheable    | The route becomes uncacheable | `max-age=0, no-store`, `s-maxage` lowered to 0  |

- A [max age](/overview/max-age) of `'permanent'` never lowers the max age.
- A stale if error duration of `0` (for example a part that doesn't define one)
  doesn't lower the value either.
- If a part is returned from cache, the remaining time until it expires bubbles,
  not its original max age.
- Shared caches use `s-maxage` instead of `max-age`. If the page or a merged API
  response sets an `s-maxage`, the header gets the lowest lifetime for shared
  caches of all sources: Their `s-maxage` or, without one, their `max-age`. A
  page with `s-maxage=86400` and a part with a max age of 60 seconds gets
  `s-maxage=60`, and a page with `max-age=0` doesn't get the `s-maxage=3600` of
  an API route.
- Bubbling never makes a route cacheable. The route must still be marked as
  cacheable using [useRouteCache](/composables/useRouteCache).

## Where to Use It

### Component Cache

Set the `bubble-cacheability` prop on
[`<RenderCacheable>`](/features/component-cache). By default, nothing bubbles.

```vue
<template>
  <RenderCacheable max-age="1h" :cache-tags="['navbar']" bubble-cacheability>
    <Navbar />
  </RenderCacheable>
</template>
```

This bubbles the values of the props and the values set with
[useComponentCache](/composables/useComponentCache), when the component is
rendered or returned from cache.

### Data Cache

Pass the option to [useDataCache](/composables/useDataCache) or
[useDataCacheCallback](/composables/useDataCacheCallback). By default, nothing
bubbles.

```typescript
const { value, addToCache } = await useDataCache('weather', null, {
  bubbleCacheability: true,
})
```

`useDataCache` bubbles the cached item when a value is returned from cache, and
the values passed to `addToCache` when it is called.

```typescript
const weather = await useDataCacheCallback(
  'weather',
  async (helper) => {
    const response = await $fetch('/api/getWeather')
    if (helper && import.meta.server) {
      helper.setMaxAge('5m').addTags(['weather'])
    }
    return response
  },
  null,
  { bubbleCacheability: 'route' },
)
```

`useDataCacheCallback` also bubbles a call to `setUncacheable()` on the helper,
and the stale item when a stale value is returned.

In a Nuxt app context, pass `null` as the event. In a Nitro server context, the
event is required.

### API Routes

The interceptor returned by
[useCacheAwareFetchInterceptor](/composables/useCacheAwareFetchInterceptor)
bubbles the CDN headers and the route cache values of API routes that are
fetched during SSR. Here, bubbling is enabled by default:

```typescript
const { data } = await useFetch(
  '/api/load-users',
  useCacheAwareFetchInterceptor(),
)
```
