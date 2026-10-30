# Server Options

Вся динамическая конфигурация находится в специальном runtime-файле, расположенном по адресу `~/server/multiCache.serverOptions.ts`. Этот файл объединяется вместе со сборкой nitro в папке .output.

Создайте файл с именем `multiCache.serverOptions.ts` (или js/mjs) внутри папки `server` в корне вашего Nuxt.

::: info

В предыдущих версиях файл располагался в `~/app/multiCache.serverOptions.ts`. Для будущей совместимости с Nuxt 4 путь был изменен на _server dir_, который по умолчанию `<root>/server`. Старое расположение файла все еще поддерживается, но будет удалено в следующем major релизе.

:::

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // ...
  }
})
```

:::

## Конфигурация кеша

Для каждого кеша вы можете определить пользовательские параметры для unstorage instance, например, пользовательский драйвер кеша.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import redisDriver from 'unstorage/drivers/redis'

export default defineMultiCacheOptions(() => {
  return {
    data: {
      storage: {
        driver: redisDriver({
          base: 'data:',
        }),
      },
    },

    component: {
      storage: {
        driver: redisDriver({
          base: 'component:',
        }),
      },
    },
  }
})
```

:::

## Пользовательская генерация ключа кеша для route cache

[См. этот раздел](/ru/features/route-cache#cache-key-for-routes)

## Пользовательская авторизация API

Этот метод будет вызван для каждого запроса к API. Функция получает объект `H3Event` в качестве аргумента и может решить, предоставлена ли авторизация, вернув Promise, который разрешается в `true` или `false`.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { isAuthenticated } from './somewhere'

export default defineMultiCacheOptions(() => {
  return {
    api: {
      // Используйте пользовательский метод проверки авторизации. Может быть что-то вроде
      // cookie, basic auth или IP-адреса запроса.
      authorization: async function (event) {
        return await isAuthenticated(event)
      },
    },
  }
})
```

:::

## Отключение всех кешей для отдельного запроса

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    // Пользовательский callback, который решает, должно ли быть включено кеширование
    // для текущего запроса. Возврат false здесь предотвращает доступ к кешу
    // на время запроса.
    enabledForRequest: async function (event) {
      const user = await getUserFromRequest(event)

      // Отключить все кеширование для авторизованных пользователей.
      if (user.isLoggedIn) {
        return false
      }

      // Кеши включены для анонимных пользователей.
      return true
    },
  }
})
```

:::

## Использование глобального префикса кеша

Вы можете автоматически добавлять префикс к каждому элементу кеша. Это повлияет на все кеши и будет добавлено к каждому ключу кеша.

### Статический

Передайте статическую строку, которая включается в сборку. Распространенный случай использования - если вы используете ваше Nuxt-приложение для обслуживания нескольких доменов, но используете один и тот же backend кеша (например, redis).

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: 'example_com',
  }
})
```

:::

### Динамический

Предоставьте метод, который определяет префикс ключа кеша для каждого запроса. Один из случаев использования - если ваше приложение отвечает по-разному в зависимости от заголовков запроса, например, `Accept-Language`.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { H3Event, getHeader } from 'h3'

function getCacheKeyPrefix(event: H3Event): string {
  const acceptLanguage = getHeader(event, 'accept-language') || ''

  if (acceptLanguage.includes('de')) {
    return 'de'
  }
  return 'en'
}

export default defineMultiCacheOptions(() => {
  return {
    cacheKeyPrefix: (event) => {
      return Promise.resolve(getCacheKeyPrefix(event))
    },
  }
})
```

:::
