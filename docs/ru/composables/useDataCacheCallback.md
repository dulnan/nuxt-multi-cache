# useDataCacheCallback

Доступен в **Nuxt** и **Nitro**.

Этот composable доступен если [функция Data Cache](/ru/features/data-cache) включена. Он будет вызывать предоставленный callback только один раз, а после этого возвращать значение из кеша.

## Полный пример

```typescript
const route = useRoute()
const userId = route.params.id

const key = computed(() => 'get-user-' + userId)

const { data } = await useAsyncData(() => {
  // Будет кешировано на сервере.
  // На клиенте всегда будет выполняться.
  // Метод возвращает значение `value`, возвращенное callback.
  return useDataCacheCallback(key.value, async (cache) => {
    const value = await $fetch('/api/get-user/' + userId)

    // Cache helper доступен только на сервере.
    // Рекомендуется также проверять "import.meta.server", чтобы код
    // внутри был удален из клиентских бандлов.
    if (cache && import.meta.server) {
      cache.addTags(['user:' + userId]).setMaxAge('1h')
    }

    return value
  })
})
```

Callback выполняется только один раз на сервере. Для каждого последующего запроса в следующие 60 минут он будет возвращать значение из кеша, или пока не будет очищен cache tag `user:*`.

## Аргументы

### key: `string`

Ключ для элемента кеша.

### cb?: `(cache?: DataCacheHelper) => Promise<T>`

Callback вызывается всякий раз, когда ничего не существует в кеше или если элемент в кеше истек. Значение, которое вы возвращаете, будет помещено в кеш.

Callback также получает _cache helper_ в качестве аргумента. Cache helper доступен только на сервере. Helper предоставляет методы для управления кешируемостью:

```typescript
const data = await useDataCacheCallback(
  'data-cache-callback-key',
  function (helper) {
    if (helper && import.meta.server) {
      // Добавить cache tags.
      helper.addTags(['one', 'two', 'three'])

      // Ревалидировать через 4 часа.
      helper.setMaxAge('4h')

      // Позволяет composable вернуть устаревшее значение до одного дня,
      // если этот callback выбросит ошибку.
      helper.setStaleIfError('1d')
    }

    return {
      timestamp: Date.now(),
    }
  },
)
```

Рекомендуется оборачивать вызовы методов helper в `if (helper && import.meta.server)`, чтобы весь if блок мог быть удален из клиентских бандлов.

### event?: `H3Event`

Опциональный `H3Event` event. Не требуется, когда composable вызывается в контексте Nuxt приложения (например, плагин, другие composables, компонент).

При вызове в серверном контексте Nitro аргумент обязателен.

## Возвращаемое значение

Метод вернет значение из вашего callback.

```typescript
const data = await useDataCacheCallback('users', async (cache) => {
  if (cache && import.meta.server) {
    cache.addTags('users').setMaxAge('1h')
  }

  return {
    firstName: 'John',
    lastName: 'Wayne',
  }
})

console.log(data)
// [{ firstName: "John", lastName: "Wayne" }]
```
