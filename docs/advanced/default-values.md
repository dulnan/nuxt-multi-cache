# Defining Default Values for Route Cache / CDN

You may have noticed that there is no way to provide "default cacheability" via
configuration. This is because the module does not cache anything by default.

However, there are several ways to define default cacheability, depending on the
use case. They all work per request.

## Using a global cache key prefix

It's possible to prefix all cache keys automatically with a static or dynamic
key using the
[cacheKeyPrefix option](/overview/server-options#use-a-global-cache-prefix).

## Route Cache

### For Nuxt Pages

If you want to cache all Nuxt pages by default you can use the `useRouteCache`
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

If you additionally want to include custom API routes, you can define a
[server middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware):

::: code-group

```typescript [./server/middleware/routeCache.ts]
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  // Cache all routes for 7 days.
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(604800)
  }, event)
})
```

:::

This will be executed for every request, including Nuxt pages and server routes.

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
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper.public().setMaxAge(604800)
  }, event)
})
```

:::
