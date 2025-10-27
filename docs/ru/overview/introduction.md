---
title: Введение
editLink: true
---

# Введение

nuxt-multi-cache - это мощный модуль **серверного** кеширования для Nuxt. Он значительно улучшает производительность приложений Nuxt с большим количеством динамического контента (таких как большие CMS-сайты или пользовательский контент). Даже если у вас всего несколько десятков страниц, вы можете повысить среднюю производительность.

- Несколько бэкендов кеша (memory, redis, Cloudflare KV) через [unstorage](https://github.com/unjs/unstorage)
- Полностью модульная система, выбирайте только нужные функции
- API инвалидации кеша
- Минимальное влияние на клиентский бандл и производительность
- Работает в режимах SSR (серверный рендеринг) и SSG (статическая генерация сайта)
- Большое покрытие тестами

## Установка

### Шаг 1: Установка пакета

Установите модуль с помощью вашего менеджера пакетов.

```sh
npm install --save nuxt-multi-cache
```

### Шаг 2: Настройка

Добавьте модуль в конфигурацию Nuxt.

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],
})
```

По умолчанию модуль не включает ни одной функции, вы должны вручную определить, какие хотите использовать.

## [Component Cache](/ru/features/component-cache)

Кеширование отрендеренной разметки компонентов на сервере. Идеально подходит для сложных, глубоко вложенных компонентов, таких как меню или футеры.

```vue
<template>
  <div>
    <RenderCacheable>
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

## [Route Cache](/ru/features/route-cache)

Динамическое кеширование страниц и API-маршрутов.

```typescript
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable()
})
```

## [Data Cache](/ru/features/data-cache)

Универсальный кеш для всего, что можно преобразовать в строку.

```typescript
const { value, addToCache } = await useDataCache('weather')
```

## [CDN Cache Control](/ru/features/cdn-cache-control)

Динамическая установка заголовков `Cache-Control` и `Cache-Tag` для Cloudflare, Fastly и других сервисов.

```typescript
useCDNHeaders((helper) => {
  helper
    .public()
    .setNumeric('maxAge', 21600)
    .setNumeric('staleIfError', 43200)
    .addTags(['one', 'two'])
})
```
