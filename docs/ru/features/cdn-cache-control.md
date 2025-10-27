# CDN Cache Headers

Сервисы типа Cloudflare, Fastly, Akamai или Varnish используют специальные заголовки для управления кешируемостью ответов. Часто они отличаются от значений Cache-Control, предназначенных для браузеров. Эта функция предоставляет простой способ управления этими заголовками во время выполнения запроса.

## Конфигурация

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    cdn: {
      /**
      * Включить функцию CDN заголовков.
      */
      enabled: true,

      /**
      * Заголовок для использования для настроек cache-control.
      */
      cacheControlHeader: 'CDN-Cache-Control',

      /**
      * Заголовок для использования для cache tags заголовка.
      */
      cacheTagHeader: 'Cache-Tag'
    }
  }
})
```

### Распространенные заголовки

| Сервис                                                                                        | cacheControlHeader  | cacheTagHeader   |
| --------------------------------------------------------------------------------------------- | ------------------- | ---------------- |
| [**Fastly**](https://docs.fastly.com/en/guides/controlling-caching)                          | `Surrogate-Control` | `Surrogate-Key`  |
| [**Cloudflare**](https://developers.cloudflare.com/cache/about/cdn-cache-control/)           | `CDN-Cache-Control` | `Cache-Tag`      |
| [**Akamai**](https://techdocs.akamai.com/property-mgr/docs/know-caching)                     | `Edge-Control`      | `Edge-Cache-Tag` |
| [**nginx**](https://www.nginx.com/blog/nginx-caching-guide/)                                 | `Cache-Control`\*   | _unsupported_    |
| [**varnish**](https://www.varnish-software.com/developers/tutorials/http-caching-basics/)    | `Cache-Control`\*   | `X-Cache-Tags`   |

**\* Этот заголовок будет конфликтовать с заголовком cache control, предназначенным для браузеров. С varnish вы можете использовать пользовательский заголовок типа `X-Cache-Control`, а затем обработать его в пользовательском VCL.**

## Использование на страницах / в компонентах

Используйте composable [`useCDNHeaders`](/ru/composables/useCDNHeaders) в ваших компонентах для установки свойств CDN заголовков:

```vue
<template>
  <div>Эта страница имеет специальные CDN cache control заголовки.</div>
</template>

<script lang="ts" setup>
useCDNHeaders((helper) => {
  helper
    .addTags(['one', 'two'])
    .public()
    .setNumeric('maxAge', 21600)
    .setNumeric('staleIfError', 43200)
})
</script>
```

Это установит следующие заголовки в ответе:

```http
Cache-Tag: one two
Surrogate-Control: max-age=21600, public, stale-if-error=43200
```

Вы можете использовать composable несколько раз в разных компонентах во время запроса. Это полезно, если вы обычно хотите кешировать страницы надолго (например, на 7 дней), но уменьшить max age для определенных компонентов. Например, страница, показывающая текущую погоду, должна кешироваться максимум 1 час. Вы можете установить max age внутри компонента `Weather`:

```vue
<template>
  <div>
    <!-- Рендер Weather -->
  </div>
</template>

<script lang="ts" setup>
const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather')
})

useCDNHeaders((v) => v.setNumeric('maxAge', 3600))
</script>
```

Это переопределит значение `maxAge` на 3600. `setNumeric` - это специальный метод, который переопределяет значение только если оно меньше текущего значения.

Теперь каждый раз, когда этот компонент используется на странице, он гарантирует, что ответ будет кеширован максимум 1 час, даже если страница, содержащая компонент, определила max age 7 дней.

## Использование в Server Handlers

Helper `useCDNHeaders` также доступен как server util в контексте nitro. Он автоматически импортируется и может использоваться в event handlers или hooks.

В отличие от composable, он требует передачи event в качестве второго аргумента.

```typescript
export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper
      .public()
      .setNumeric('maxAge', 3600)
      .set('staleIfError', 24000)
      .set('staleWhileRevalidate', 60000)
      .set('mustRevalidate', true)
      .addTags(['api'])
  }, event)

  return {
    api: 'Этот ответ должен иметь CDN заголовки.',
  }
})
```

## Использование в других местах

Состояние значений CDN заголовков хранится в текущем запросе, поэтому пока у вас есть доступ к event, вы можете использовать composable где угодно.

## Объединение кешируемости

Обратите внимание, что использование `useCDNHeaders()` применяется только для **текущего request event**. Например, предположим, у нас есть API маршрут, который загружает список пользователей:

```ts
import { defineEventHandler } from 'h3'
import { useCDNHeaders, db } from '#imports'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper.public().setNumeric('maxAge', 60)
  }, event)

  return db.query('users')
})
```

И страница, которая вызывает этот API:

```vue
<script lang="ts" setup>
const { data } = useFetch('/api/load-users')

useCDNHeaders((cdn) => {
  cdn.public().setNumeric('maxAge', 3600)
})
</script>
```

Ответ **самой страницы** будет иметь max-age 3600, даже если ваш API имеет max-age 60.

Если вы хотите "пробросить" кешируемость ваших API вызовов на страницу, вы можете сделать это, вызвав метод `mergeFromResponse()` на CDN helper:

```typescript
const event = useRequestEvent()

const { data } = await useFetch('/api/load-users', {
  onResponse({ response }) {
    useCDNHeaders((cdn) => cdn.mergeFromResponse(response), event)
  },
})
```

Модуль также предоставляет composable [useCacheAwareFetchInterceptor](/ru/composables/useCacheAwareFetchInterceptor), который обрабатывает "проброс" кешируемости из запроса к API маршруту.
