# Конфигурация

nuxt-multi-cache следует подходу "opt-in", что означает: простая установка модуля не добавит кеширование в ваше приложение.

::: warning

Не все параметры конфигурации доступны через `nuxt.config.ts`! Некоторые должны быть переданы через [файл конфигурации server options](/ru/overview/server-options), поскольку они должны быть включены в серверную сборку (что невозможно через `nuxt.config.ts`).

:::

## Добавление и включение функций

Функция может быть **добавлена** и/или **включена**, что означает:

- **добавлена**: Функция _в целом_ добавлена и доступна в вашем приложении (например, composables или компоненты)
- **включена**: Функция включена и будет выполнять свою функциональность (например, кеширование)

Этот "двухэтапный" подход позволяет вам _в целом_ добавить composable типа `useDataCache`, но при этом позволяет отключить фактическое кеширование, что очень вероятно в случае локальной разработки или при отладке на развернутых приложениях. Также возможно включать или отключать функцию через [runtime config](/ru/overview/runtime-config).

### Пример

Это добавляет все composables для [data cache](/ru/features/data-cache) и также включает все кеширование:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    data: {
      enabled: true,
    },
  },
})
```

Это по-прежнему добавит все composables, но отключит фактическое кеширование:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    data: {
      enabled: false,
    },
  },
})
```

Ни один из composables не добавлен, поэтому использовать data cache вообще не получится:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {},
})
```

## Полный пример

Этот пример использует все возможные параметры конфигурации.

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-multi-cache'],

  multiCache: {
    // Component cache включен.
    component: {
      enabled: true,
    },

    // Data cache включен.
    data: {
      enabled: true,
    },

    // Route cache отключен. Но поскольку свойство `route` установлено,
    // composable useRouteCache все равно добавлен в сборку, он просто не кеширует.
    route: {
      enabled: false,
    },

    // Функция CDN Cache Control Headers.
    cdn: {
      enabled: true,

      // Установить пользовательский cache control для Cloudflare.
      cacheControlHeader: 'CDN-Cache-Control',

      // Установить пользовательский заголовок cache tags для Cloudflare.
      cacheTagHeader: 'Cache-Tag',
    },

    // API управления кешем.
    api: {
      enabled: true,

      // Использовать другой префикс для API endpoints.
      prefix: '/api/nuxt-multi-cache',

      // Отключить проверку авторизации в API.
      authorization: false,

      // Инвалидации cache tag должны буферизироваться в течение 5 минут
      // до фактической очистки элементов кеша.
      cacheTagInvalidationDelay: 300000, // 5 минут
    },

    // Логировать подробные отладочные сообщения, например, когда элементы кешируются
    // или возвращаются из кеша.
    debug: true,

    // Отключить логирование обзора кеша при запуске приложения.
    disableCacheOverviewLogMessage: true,
  },
})
```

## Справочник

<<< @/../src/build/options/index.ts
