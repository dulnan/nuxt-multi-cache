# useCacheAwareFetchInterceptor

Доступен только в **Nuxt**.

Этот composable возвращает объект с `onRequest` и `onResponse` fetch interceptors. Это позволяет вам пробрасывать кешируемость [CDN Cache Control](/ru/features/cdn-cache-control) и [Route Cache](/ru/features/route-cache) к текущему запросу.

```typescript
const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch('/api/load-users', interceptor)
```

## Полный пример

Предположим, у вас есть API маршрут `/api/load-users`, который загружает пользователей. Event handler добавляет специфическую кешируемость для этого маршрута:

```typescript
export default defineEventHandler(async (event) => {
  useCDNHeaders((helper) => {
    helper.addTags(['user-list']).setNumeric('maxAge', '1h')
  }, event)

  return loadUsers()
})
```

Он добавляет cache tag `user-list` и определяет max age **1 час**.

Затем на странице, которая загружает пользователей из вашего API маршрута:

```vue
<script lang="ts" setup>
const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch('/api/load-users', interceptor)

useCDNHeaders((cdn) => {
  cdn.addTags(['page-users']).setNumeric('maxAge', '7d')
})
</script>
```

Используя interceptor, и cache tags, и max age (и все другие значения Cache-Control) объединяются с SSR запросом, рендерящим страницу.

Объединение следует тем же "правилам", что и обычно: Когда установлено несколько значений `maxAge`, **побеждает наименьшее**. В нашем случае заголовок ответа отрендеренной страницы будет `Cache-Control: max-age=3600`, потому что это max age, определенный в event handler.

То же самое также работает при использовании route cache: В этом случае cache tags из API маршрута будут объединены с cache tags SSR запроса.
