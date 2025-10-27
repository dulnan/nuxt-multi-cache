# Stale if Error

Все кеши поддерживают поведение _stale if error_. Это позволяет им возвращать устаревшие элементы кеша, если во время ревалидации происходит ошибка.

## Data Cache

Composable [useDataCache](/ru/composables/useDataCache) возвращает `staleValue`, если:

- Данные были кешированы с предоставлением аргумента `staleIfError` в `addToCache`
- Кешированные данные все еще находятся в пределах диапазона `staleIfError`

```typescript
async function loadUser(userId: string): Use {
  const { value, addToCache, staleValue } = await useDataCache(key.value)

  // Валидное, не устаревшее значение существует в кеше.
  if (value) {
    return value
  }

  try {
    const response = await $fetch('/api/get-user/' + userId)

    await addToCache(
      // Объект, который мы хотим закешировать.
      response,
      // Cache tags.
      ['user:' + userId],
      // Max age для кешированных данных.
      '5m',
      // Как долго staleValue должно возвращаться.
      '2h',
    )
    return response
  } catch (e) {
    // Вернуть stale value, если доступно. Composable возвращает
    // staleValue только если оно все еще в пределах указанного max stale-if-error диапазона.
    if (staleValue) {
      return staleValue
    }

    // Пробросить ошибку дальше, чтобы она могла быть обработана правильно.
    throw e
  }
}
```

## Component Cache

Компонент [`<RenderCacheable>`](/ru/features/component-cache#usage) вернет stale markup, если произойдет ошибка во время рендеринга его **default slot**.

Длительность _stale if error_ можно установить через prop `stale-if-error` на компоненте:

```vue
<template>
  <div>
    <RenderCacheable max-age="5m" stale-if-error="2h">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

Или где угодно внутри компонентов, которые рендерятся внутри `<RenderCacheable>`, используя composable [useComponentCache](/ru/composables/useComponentCache):

```typescript
useComponentCache((helper) => {
  helper.setMaxAge('5m').setStaleIfError('2h')
})
```

## Route Cache

Используйте метод `setStaleIfError` на _route cache helper_, предоставляемом [useRouteCache](/ru/composables/useRouteCache):

```vue
<template>
  <div>
    Эта страница кешируется на 5 минут или до 2 часов, когда ревалидация не удается.
  </div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setMaxAge('5m').setStaleIfError('2h').setCacheable()
})
</script>
```
