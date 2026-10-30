# Migrating from V1

V2 was implemented from scratch and works completely different than V1. Also due
to the breaking changes introduced in Nuxt 3 migrating the code to support Nuxt
3 was not possible.

## $cache Plugin

The injected global `$cache` plugin is replaced by composables for each cache.

## $cache.data

Use the `useDataCache` composable to access the data cache.

### Nuxt 2

```typescript
export default {
  async asyncData({ app }) {
    const cached = await app.$cache.data.get('weather')
    if (cached) {
      return cached
    }

    const response = await this.$axios.get('/api/getWeather')
    await app.$cache.data.set('weather', response)
    return response
  },
}
```

### Nuxt 3

```typescript
const { data: weather } = await useAsyncData('weather', async () => {
  const { value, addToCache } = await useDataCache('weather')
  // Data is available from cache.
  // The value object has the correct type if provided.
  if (value) {
    return value
  }

  // Fetch data and add it to cache.
  const response = await $fetch<WeatherResponse>('/api/getWeather')
  addToCache(response)
  return response
})
```

## $cache.route

Use the `useRouteCache` composable to manage the cacheability of pages.

### Nuxt 2

```vue
<script>
export default {
  async asyncData({ app }) {
    app.$cache.route.setCacheable()
    app.$cache.route.addTags(['article:5', 'image:14'])
  },
}
</script>
```

### Nuxt 3

```vue
<script lang="ts" setup>
useRouteCache((v) => v.setCacheable().addTags(['article:5', 'image:14']))
</script>
```

## Component Cache

Previously every component was able to define a `serverCacheKey` to make itself
cacheable. This feature has been removed from V3 of vue/server-renderer. This
module provides a custom `<RenderCacheable>` component to achieve the same
thing.

### Nuxt 2

```vue
<template>
  <div class="product-teaser" :class="{ 'is-highlighted': isHighlighted }">
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
export default {
  name: 'ProductTeaser',

  props: {
    productId: String,
    isHighlighted: Boolean,
    title: String,
  },

  serverCacheKey(props) {
    const variant = props.isHighlighted ? 'highlighted' : 'default'
    return `${props.productId}_${variant}`
  },
}
</script>
```

### Nuxt 3

```vue
<template>
  <div>
    <RenderCacheable :cache-tag="product.id + '_' + product.isHighlighted">
      <ProductTeaser
        :productId="product.id"
        :is-highlighted="product.isHighlighted"
        :title="product.title"
      />
    </RenderCacheable>
  </div>
</template>
```

## API

The API offers the same functionality as before, but the routes have been
renamed.
