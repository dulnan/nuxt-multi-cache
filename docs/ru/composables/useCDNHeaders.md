# useCDNHeaders

Доступен в **Nuxt** и **Nitro**.

Composable `useCDNHeaders`, который включен если [функция CDN](/ru/features/cdn-cache-control) включена, ожидает callback, который он вызовет с helper в качестве первого аргумента. Такой подход позволяет Rollup удалить код из клиентских бандлов. Это даже включает сам вызов `useCDNHeaders`, поэтому влияние на размер клиентского бандла равно 0.

Для управления свойствами cache control (такими как maxAge, mustRevalidate, maxStale и т.д.) используется библиотека [@tusbar/cache-control](https://github.com/tusbar/cache-control).

В контексте Nuxt приложения composable может быть вызван без аргументов. В серверном контексте composable ожидает объект `H3Event` в качестве единственного аргумента.

## Полный пример

```typescript
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 3600)
    .set('staleIfError', 24000)
    .set('staleWhileRevalidate', 60000)
    .set('mustRevalidate', true)
    .addTags(['api'])
})
```

## Аргументы

### callback?: `(cache: NuxtMultiCacheCDNHelper) => void`

Callback, который получает CDN cache helper. Callback вызывается только на сервере.

### event?: `H3Event`

Опциональный `H3Event` event. Не требуется, когда composable вызывается в контексте Nuxt приложения (например, плагин, другие composables, компонент).

При вызове в серверном контексте Nitro аргумент обязателен.

## Методы

### set(key: string, value: any)

Установить значение для свойства cache control. Оба аргумента полностью типизированы, например, вы можете видеть возможные значения в вашей IDE.

### setNumeric(key: string, value: number)

Этот метод работает для следующих числовых свойств:

- maxAge
- sharedMaxAge
- maxStaleDuration
- minFresh
- staleWhileRevalidate
- staleIfError

Метод установит значение **только если оно меньше текущего значения**.

### setBoolean(key: string)

Этот метод работает для следующих булевых свойств:

- immutable
- maxStale
- mustRevalidate
- noCache
- noStore
- noTransform
- onlyIfCached
- proxyRevalidate

Метод всегда устанавливает булево значение в `true`.

### private()

Устанавливает `private` в `true` и устанавливает значение `public` в `false`. Используйте это, если хотите убедиться, что ответ не кешируется на CDN.

### public()

Помечает ответ как [`public`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#public). Это означает, что ответ может быть кеширован в публичном кеше. Обычно это случай для страниц для анонимных пользователей.

Если ответ был ранее помечен `private`, то это не имеет эффекта: Значение `public` останется `false`.

### addTags(tags: string[])

Добавить cache tags для заголовка Cache-Tag. Дубликаты будут автоматически удалены.

### mergeFromResponse(response: FetchResponse)

Объединяет cache tags и cache control из данного fetch ответа.

Обратите внимание, что внутренне метод будет вызывать только setNumeric(), setBoolean() и private(), что означает, что объединение никогда не установит более высокий max age, чем текущий, или не пометит ответ как public.

```typescript
const event = useRequestEvent()

const { data } = await useAsyncData(() => {
  return $fetch.raw('/api/load-users').then((response) => {
    useCDNHeaders((cdn) => {
      cdn.mergeFromResponse(response)
    }, event)

    return response.json()
  })
})
```

### mergeCacheControlHeader(header: string)

Парсит и объединяет данное значение заголовка `Cache-Control`.
