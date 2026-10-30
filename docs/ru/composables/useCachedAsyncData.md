# useCachedAsyncData

Доступен только в **Nuxt**.

Helper composable для использования [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) вместе с [useDataCache](/ru/composables/useDataCache), с опциональным кешированием на клиентской стороне.

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    clientMaxAge: 'permanent',
    serverMaxAge: 'permanent',
  },
)
```

## Полный пример

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Кешировать на час на сервере.
    serverMaxAge: 60 * 60,

    // Добавить тег, чтобы можно было инвалидировать элемент кеша.
    serverCacheTags: ['users-list'],

    // Разрешить клиенту/браузеру кешировать на 10 минут.
    clientMaxAge: 10 * 60,

    // Трансформировать данные. Трансформированные данные будут помещены в кеш.
    transform: function (data) {
      return data.users
    },
  },
)
```

Сигнатура функции идентична useAsyncData, но первый аргумент `key` всегда обязателен.

## Аргументы

### key: `string`

Ключ, который используется для получения/установки элемента data cache.

### handler: `(app?: NuxtApp) => Promise<ResT>`

Handler, обычно для загрузки каких-то данных. Результат handler будет кеширован.

### options: `CachedAsyncDataOptions`

Тип расширяет `AsyncDataOptions` из Nuxt и добавляет три дополнительных свойства:

#### clientMaxAge?: `number`

По умолчанию composable будет кешировать только на серверной стороне и не будет выполнять кеширование на клиентской стороне. Это можно изменить, предоставив значение `clientMaxAge`. В этом случае composable будет хранить результат в `nuxtApp.static.data` и будет возвращать кешированные данные в течение указанной длительности.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Кешировать этот запрос на 10 минут.
    clientMaxAge: 60 * 10,
    serverMaxAge: 'midnight',
  },
)
```

Вы можете инвалидировать кеш, вызвав `refresh()` или `clear()`:

```typescript
const { data, refresh } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    clientMaxAge: 60 * 10,
    serverMaxAge: 'never',
  },
)

async function createNewUser() {
  await $fetch('/api/create-user')
  // Принудительное обновление, которое перезагрузит данные и снова сохранит их в кеше.
  await refresh()
}
```

#### serverMaxAge?: `((v: ResT) => number|undefined) | number`

Max age для элемента кеша. Может быть либо методом, либо значением.

Когда определен метод, он получает результат вашего handler в качестве первого аргумента и должен вернуть число.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Кешировать на 3600 секунд (1 час).
    serverMaxAge: 60 * 60,
    clientMaxAge: 'never',
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Использовать max age из ответа API.
    serverMaxAge: (data) => data.maxAge,
    clientMaxAge: 'never',
  },
)
```

#### serverCacheTags?: `((v: ResT) => string[]|undefined) | string[]`

Cache tags для элемента кеша. Может быть либо методом, либо значением.

Когда определен метод, он получает результат вашего handler в качестве первого аргумента и должен вернуть значение.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Жестко заданные cache tags.
    serverCacheTags: ['users-list'],
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Использовать cache tags из ответа API.
    serverCacheTags: (data) => data.cacheTags,
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```

## Советы

### Используйте опцию `transform`

Composable будет кешировать результат метода `transform`, так что метод вызывается только один раз. Это применимо как для клиентского, так и для серверного кеширования. Это также помогает сделать элемент кеша меньше.

Например, здесь мы загружаем весь список пользователей, но нам нужны только некоторые свойства. Реализовав метод transform, мы можем значительно уменьшить размер как payload, так и элемента кеша:

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users-emails',
  () => $fetch('/api/users'),
  {
    serverMaxAge: 60 * 60,
    clientMaxAge: 10 * 60,
    transform: function (data) {
      return data.users.map((v) => {
        return {
          id: v.id,
          email: v.email,
        }
      })
    },
  },
)
```

### Убедитесь, что нет побочных эффектов

Внутри вашего handler composable или метода `transform` вы не должны изменять какие-либо значения вне этих методов, потому что они не будут выполнены, когда composable возвращает что-то из кеша.

### Убедитесь, что ключ уникален

Ключ, который вы предоставляете, используется как есть для элемента кеша. Убедитесь, что этот ключ уникален, иначе вы можете столкнуться с неожиданным поведением:

```typescript
// Мы загружаем некоторые данные и сохраняем их в кеше.
const { value, addToCache } = await useDataCache('all-users')
if (!value) {
  const data = await $fetch('/api/users')
  await addToCache(data)
}

// Позже мы переиспользуем тот же ключ, но fetch другой.
// Поскольку уже есть элемент кеша с этим ключом, он вернет этот,
// что приведет к неожиданному поведению.
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/user-emails'),
  {
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```
