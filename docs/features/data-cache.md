# Data Cache

A generic cache for any type of data (that can be stringified).

## Configuration

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    data: {
      // If true the cache is enabled.
      // If false the cache is disabled, but the composable is still added to
      // the build.
      enabled: true,

      // Provide custom options for unstorage.
      storage: {}
    }
  }
}
```

## Usage in Components

Use the `useDataCache` composable in a page, layout or any component:

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
  addToCache(response)
  return response
})
</script>
```

## Usage in Server Handlers

You can use it in custom server handlers, but you have to provide the `H3Event`
object as the second argument.

```typescript
import { useDataCache } from '#nuxt-multi-cache/composables'

export default defineEventHandler(async (event) => {
  const { value, addToCache } = await useDataCache('weather')
  if (value) {
    return value
  }

  const response = await getWeatherFromExternalApi()
  addToCache(response)
  return response
})
```

## Composable

The composable takes a required key as the first argument and an optional
`H3Event` as the second. It returns a Promise that resolves to an object with
the following properties:

### value: T|undefined

The value from cache if found. The type is generic, you can provide it when
calling `useDataCache`:

```typescript
const { value } = await useDataCache<WeatherResponse>('weather')
```

### addToCache(data: any, tags?: string[], maxAge?: number)

Use this method to add data to the cache for the given key. The data should be
a string or an object that can be stringified to JSON.

The optional second argument allows you to define cache tags which can be later
used to invalidate a cache item.

With the optional third argument you can define a max age for the cache item.
