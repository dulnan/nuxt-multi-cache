# useDataCache

Доступен в **Nuxt** и **Nitro**.

Этот composable доступен если [функция Data Cache](/ru/features/data-cache) включена. Он позволяет вам хранить что угодно в кеше.

## Полный пример

```typescript
const route = useRoute()
const userId = route.params.id

const key = computed(() => 'get-user-' + userId)

const { data: weather } = await useAsyncData(async () => {
  const { value, addToCache } = await useDataCache(key.value)
  // Данные доступны из кеша.
  // Объект value имеет правильный тип, если предоставлен.
  if (value) {
    return value
  }

  // Загружаем данные и добавляем их в кеш.
  const response = await $fetch('/api/get-user/' + userId)

  // Добавляем в кеш, также предоставляя cache tags и max age.
  await addToCache(response, ['user:' + userId], 3600)
  return response
})
```

## Аргументы

### key: `string`

Ключ для элемента кеша.

### event?: `H3Event`

Опциональный `H3Event` event. Не требуется, когда composable вызывается в контексте Nuxt приложения (например, плагин, другие composables, компонент).

При вызове в серверном контексте Nitro аргумент обязателен.

## Возвращаемое значение

Composable возвращает Promise, который разрешается в объект со следующими свойствами:

### value: `T|undefined`

Значение из кеша, если найдено. Тип является generic, вы можете предоставить его при вызове `useDataCache`:

```typescript
const { value } = await useDataCache<WeatherResponse>('weather')
```

### addToCache: `(data: any, tags?: string[], maxAge?: MaxAge, staleIfError?: MaxAge)`

Используйте этот метод для добавления данных в кеш для данного ключа. Данные должны быть строкой или объектом, который может быть преобразован в JSON.

Опциональный второй аргумент позволяет определить cache tags, которые могут быть позже использованы для инвалидации элемента кеша.

С опциональным третьим аргументом вы можете определить max age для элемента кеша.
