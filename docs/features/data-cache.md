# Data Cache

A generic cache for any type of data (that can be stringified).

## Configuration

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    data: {
      // If true the cache is enabled.
      // If false the cache is disabled, but the composable is still added to
      // the build.
      enabled: true,
    }
  }
}
```

```typescript [multiCache.serverOptions.ts]
// ~/server/multiCache.serverOptions.ts
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions(() => {
  return {
    data: {
      storage: {
        driver: myCustomDriver(),
      },
    },
  }
})
```

:::

## Usage in Components

Use the [`useDataCache`](/composables/useDataCache) composable in a page, layout
or any component:

```vue
<template>
  <div>
    <!-- Render Weather -->
  </div>
</template>

<script lang="ts" setup>
type Forecast = {
  day: string
  temperature: string
  icon: string
}

type WeatherResponse = {
  forecast: Forecast[]
}

const { data: weather } = await useAsyncData('weather', async () => {
  const { value, addToCache } = await useDataCache<WeatherResponse>('weather')
  // Data is available from cache.
  // The value object has the correct type if provided.
  if (value) {
    return value
  }

  // Fetch data and add it to cache.
  const response = await $fetch<WeatherResponse>('/api/getWeather')
  await addToCache(response)
  return response
})
</script>
```

## Using `useDataCacheCallback`

If you prefer a different syntax, you can use
[useDataCacheCallback](/composables/useDataCache) instead:

```typescript
const user = await useDataCacheCallback(key.value, async (cache) => {
  const response = await $fetch('/api/get-user/' + userId)

  if (cache && import.meta.server) {
    cache.addTags(['user:' + userId]).setMaxAge('1h')
  }

  return response
})
```

## Using `useCachedAsyncData`

The example above can be simplified by using the
[`useCachedAsyncData`](/composables/useCachedAsyncData) composable, which is a
wrapper around Nuxt's
[useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) composable.
It automatically caches the result of your handler function using the first
argument (`'weather'`) as the key:

```typescript
const { data: weather } = await useCachedAsyncData<WeatherResponse>(
  'weather',
  () => $fetch('/api/getWeather'),
  {
    clientMaxAge: '5m',
    serverMaxAge: 'permanent',
  },
)
```

## Usage in Server Handlers

You can use it in custom server handlers, but you have to provide the `H3Event`
object as the second argument.

```typescript
import { useDataCache } from '#imports'

export default defineEventHandler(async (event) => {
  const { value, addToCache } = await useDataCache('weather', event)
  if (value) {
    return value
  }

  const response = await getWeatherFromExternalApi()
  addToCache(response)
  return response
})
```
