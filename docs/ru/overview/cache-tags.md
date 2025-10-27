# Cache Tags

Cache tags позволяют легко инвалидировать один или несколько "связанных" элементов в разных кешах.

## Основы

Cache tag - это уникальный идентификатор чего-то вроде страницы, изображения или любого контекста:

- `article:235`
- `language:de`
- `image:313`
- `config:site:page_title`
- `image_style:hero_large_retina`

Обычно cache tags предоставляются backend'ом (например, CMS), но они также могут управляться непосредственно вашим приложением.

Если cache tags предоставляются backend'ом, вероятно, именно backend будет автоматически инвалидировать соответствующие cache tags при необходимости. nuxt-multi-cache предлагает [API endpoint для очистки одного или нескольких cache tags](/ru/features/api#purge-tags).

## Интеграция

[Component cache](/ru/features/component-cache), [data cache](/ru/features/data-cache) и [route cache](/ru/features/route-cache) предоставляют способ хранить cache tags вместе с кешированным элементом:

### Component Cache

Вы можете предоставить cache tags на компоненте `<RenderCacheable>`:

```vue
<template>
  <div>
    <RenderCacheable :cache-tags="['weather']">
      <Weather />
    </RenderCacheable>
  </div>
</template>
```

или используя composable [useComponentCache](/ru/composables/useComponentCache):

```typescript
useComponentCache((helper) => {
  helper.addTags(['weather'])
})
```

### Data Cache

Cache tags можно добавить через метод `addToCache`, возвращаемый [useDataCache](/ru/composables/useDataCache):

```typescript
const { value, addToCache } = await useDataCache<WeatherResponse>('weather')
if (value) {
  return value
}

const response = await $fetch<WeatherResponse>('/api/getWeather')
await addToCache(response, ['weather'])
```

### Route Cache

Вы можете добавлять cache tags, используя composable [useRouteCache](/ru/composables/useRouteCache):

```typescript
useRouteCache((helper) => {
  helper.addTags(['weather'])
})
```

## Очистка

[API](/ru/features/api) предлагает endpoint для очистки элементов по cache tag.

Используя три примера выше, вы можете инвалидировать кешированные данные, компонент и маршрут за один раз:

```sh
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["weather"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

По умолчанию cache tags не инвалидируются немедленно, а после фиксированной задержки, которую можно настроить [через api.cacheTagInvalidationDelay](/ru/overview/configuration) в параметрах модуля.

После задержки все три элемента удаляются из кеша.

## Cache Tag Registry

По умолчанию, чтобы "знать", какие элементы очистить из кеша при инвалидации тегов, модуль перебирает все элементы кеша и парсит их, чтобы сопоставить их cache tags с тегами для инвалидации. Хотя это может работать для малого и среднего количества кешированных элементов, это не масштабируется для больших приложений с потенциально тысячами элементов кеша и тегов.

Задача _Cache Tag Registry_ - обеспечить быстрый и эффективный способ поиска ключей кеша для удаления при инвалидации одного или нескольких cache tags.

### Использование встроенного in-memory registry

Вы можете включить встроенный cache tag registry в вашем файле [server options](/ru/overview/server-options):

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagRegistry: 'in-memory',
  }
})
```

:::

::: warning Внешние кеши

In-memory cache tag registry работает только когда **все** хранилища кеша также in-memory! Если вы используете redis, valkey или любой другой _внешний_ драйвер кеша, это будет работать только пока ваше приложение и backend кеша синхронизированы.

Если вы перезапустите приложение без очистки внешнего кеша, ваше приложение не будет знать о cache tags ваших (все еще кешированных) элементов.

:::

::: warning Несколько экземпляров

Когда вы запускаете ваше приложение в нескольких экземплярах (например, через [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), имейте в виду, что каждый экземпляр будет отслеживать свои собственные элементы кеша и теги; очистка через API затронет только случайный экземпляр.

:::

### Пользовательская реализация

Предоставьте объект в `cacheTagRegistry`, который реализует интерфейс [type.CacheTagRegistry].

Вы можете использовать встроенную in-memory registry реализацию в качестве справки:

<<< @/../src/runtime/helpers/InMemoryCacheTagRegistry.ts

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { InMemoryCacheTagRegistry } from './registry'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagRegistry: new InMemoryCacheTagRegistry(),
  }
})
```

:::
