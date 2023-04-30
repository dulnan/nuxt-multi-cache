# Defining Default Values

You may have noticed there is no way to provide default options via the
configuration. This is because by design this module will not allow to cache
anything without explicitly implementing it.

There are several ways to define default values, depending on the use case. They
all work per request.

## Using a global cache key prefix

It's possible to prefix all cache keys automatically with a static or dynamic
key using the
[cacheKeyPrefix option](/overview/server-options#use-a-global-cache-prefix).

## Route Cache

### For pages

If you want to cache all pages by default you can use the `useRouteCache`
composable in your `app.vue`, which will be executed for every page.

::: code-group

```vue [app.vue]
<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(604800)
})
</script>
```

:::

### For any route

If you want to include custom API routes, you can define a
[server middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware):

::: code-group

```typescript [./server/middleware/routeCache.ts]
import { useRouteCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  // Cache all routes for 7 days.
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(604800)
  }, event)
})
```

:::

This will be executed for every request, including pages and server routes.

## Data Cache

While you can't directly define a default max age for data cache entries, you
can easily create your own composable as a wrapper for `useDataCache`:

::: code-group

```typescript [./composables/getCachedData.ts]
export default async function (key: string) {
  const { value, addToCache } = await useDataCache(key)

  // Return custom context object with custom addToCache method.
  return {
    value: data.value,
    addToCache: (value: any) => {
      // Add to cache with a fixed max age.
      addToCache(value, [], 3600)
    },
  }
}
```

:::

## Component Cache

The default values for the props of the `<RenderCacheable>` component are falsy.
If you need to vary the cache key based on global things like current language,
domain, currency, etc., you can create your own wrapper:

::: code-group

```vue [ContextAwareCacheable.vue]
<template>
  <RenderCacheable :cacheKey="cacheKey">
    <slot></slot>
  </RenderCacheable>
</template>

<script lang="ts" setup>
const store = useStore()

const cacheKey = computed(() => {
  return [store.language, store.currency, store.domain].join('_')
})
</script>
```

:::

Or, the more clean way would be to create a composable:

::: code-group

```typescript [./composables/useGlobalContextKey.ts]
export default async function (suffix: string) {
  const store = useStore()
  return computed(() => {
    return [store.language, store.currency, store.domain, suffix].join('_')
  })
}
```

:::

And then use it like this:

```vue
<template>
  <RenderCacheable :cacheKey="cacheKey">
    <Navbar />
  </RenderCacheable>
</template>

<script lang="ts" setup>
const store = useStore()

const cacheKey = useGlobalContextKey('additional-suffix')
</script>
```

## CDN Cache Control

This works the exact same way as with the route cache, just using the
`useCDNHeaders` composable:

### For pages

::: code-group

```vue [app.vue]
<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
useCDNHeaders((helper) => {
  helper.public().setMaxAge(604800)
})
</script>
```

:::

### For any route

::: code-group

```typescript [./server/middleware/routeCache.ts]
import { useRouteCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper.public().setMaxAge(604800)
  }, event)
})
```

:::
