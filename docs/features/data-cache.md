# Data Cache

A generic cache for any type of data (that can be stringified).

The data cache only works on the server. On the client, `useDataCache` never
returns a cached value and adding items to the cache does nothing, and
`useDataCacheCallback` always calls the callback. Only
[useCachedAsyncData](/composables/useCachedAsyncData) can also cache on the
client.

## Configuration

::: code-group

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    data: {
      // If true the cache is enabled.
      // If false the cache is disabled, but the composable is still added to
      // the build.
      enabled: true,
    },
  },
})
```

```typescript [server/multiCache.serverOptions.ts]
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
[useDataCacheCallback](/composables/useDataCacheCallback) instead:

```typescript
const user = await useDataCacheCallback(key.value, async (cache) => {
  const response = await $fetch('/api/get-user/' + userId)

  if (cache && import.meta.server) {
    cache.addTags(['user:' + userId]).setMaxAge('1h')
  }

  return response
})
```

## Bubbling Cacheability

By default, the max age and cache tags of data cache items don't affect the
route cache or the CDN headers of the page that uses them. To merge them, set
the `bubbleCacheability` option:

```typescript
const { value, addToCache } = await useDataCache('weather', null, {
  bubbleCacheability: true,
})
```

See [Bubbling Cacheability](/overview/bubble-cacheability) for details.

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
  await addToCache(response)
  return response
})
```

By default, errors of the cache storage (for example if Redis is not reachable)
are thrown by the data cache composables. This can be changed with the
[bubbleError](/overview/server-options#storage-errors) server option.
