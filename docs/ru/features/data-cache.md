# Data Cache

Универсальный кеш для любого типа данных (которые могут быть преобразованы в строку).

## Конфигурация

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    data: {
      // Если true, кеш включен.
      // Если false, кеш отключен, но composable все равно добавлен в сборку.
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

## Использование в компонентах

Используйте composable [`useDataCache`](/ru/composables/useDataCache) на странице, в layout или любом компоненте:

```vue
<template>
  <div>
    <!-- Рендер Weather -->
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
  // Данные доступны из кеша.
  // Объект value имеет правильный тип, если предоставлен.
  if (value) {
    return value
  }

  // Загружаем данные и добавляем их в кеш.
  const response = await $fetch<WeatherResponse>('/api/getWeather')
  await addToCache(response)
  return response
})
</script>
```

## Использование `useDataCacheCallback`

Если вы предпочитаете другой синтаксис, можете использовать [useDataCacheCallback](/ru/composables/useDataCache) вместо этого:

```typescript
const user = await useDataCacheCallback(key.value, async (cache) => {
  const response = await $fetch('/api/get-user/' + userId)

  if (cache && import.meta.server) {
    cache.addTags(['user:' + userId]).setMaxAge('1h')
  }

  return response
})
```

## Использование `useCachedAsyncData`

Пример выше можно упростить, используя composable [`useCachedAsyncData`](/ru/composables/useCachedAsyncData), который является оберткой вокруг composable [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) из Nuxt. Он автоматически кеширует результат вашей функции-обработчика, используя первый аргумент (`'weather'`) в качестве ключа:

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

## Использование в Server Handlers

Вы можете использовать его в пользовательских server handlers, но вы должны предоставить объект `H3Event` в качестве второго аргумента.

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
