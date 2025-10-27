# Миграция с V1

V2 был реализован с нуля и работает совершенно иначе, чем V1. Также из-за breaking changes, введенных в Nuxt 3, миграция кода для поддержки Nuxt 3 была невозможна.

## Плагин $cache

Глобальный плагин `$cache` заменен composables для каждого кеша.

## $cache.data

Используйте composable `useDataCache` для доступа к data cache.

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
  // Данные доступны из кеша.
  // Объект value имеет правильный тип, если предоставлен.
  if (value) {
    return value
  }

  // Загружаем данные и добавляем их в кеш.
  const response = await $fetch<WeatherResponse>('/api/getWeather')
  addToCache(response)
  return response
})
```

## $cache.route

Используйте composable `useRouteCache` для управления кешируемостью страниц.

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

Ранее каждый компонент мог определить `serverCacheKey`, чтобы сделать себя кешируемым. Эта функция была удалена из V3 vue/server-renderer. Этот модуль предоставляет пользовательский компонент `<RenderCacheable>` для достижения того же результата.

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

API предлагает ту же функциональность, что и раньше, но маршруты были переименованы.
