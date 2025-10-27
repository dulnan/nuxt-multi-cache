# Route Cache

Кеширует страницы и ответы пользовательских server handlers. Это делается путем предоставления helper через composable, который управляет тем, должен ли ответ быть кеширован.

В отличие от встроенного кеширования Nitro, вы можете решать во время выполнения, должен ли маршрут кешироваться, как долго и т.д. Любые `routeRules` или `defineCachedEventHandler` игнорируются этим модулем (но они все равно работают, если вы хотите использовать оба одновременно).

## Конфигурация

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    route: {
      enabled: true,
    }
  }
}
```

```typescript [multiCache.serverOptions.ts]
// ~/server/multiCache.serverOptions.ts
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      storage: {
        driver: myCustomDriver(),
      },
    },
  }
})
```

:::

### Ключ кеша для маршрутов

::: warning

По умолчанию query strings **игнорируются**! Это означает, что запрос `/homepage?language=de` и `/homepage` вернут один и тот же кешированный ответ.

Причина этого решения в том, что существует бесконечное количество возможностей изменить query string. Это был бы простой способ быстро обрушить приложение, поместив сотни тысяч страниц в кеш.

:::

Ключ кеша автоматически формируется из пути маршрута. Например, `/api/query/products?id=123` преобразуется в `api:query:products`. Если вы хотите учитывать query string, вы можете предоставить функцию, которая может вернуть ключ кеша для данного маршрута:

::: code-group

```typescript [multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { getQuery, getRequestURL } from 'h3'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      buildCacheKey(event) {
        const url = getRequestURL(event)

        // Путь (без query string).
        const path = url.pathname

        // Обработка конкретных маршрутов, которым нужны query strings.
        if (path.startsWith('/api/query/products')) {
          const { id } = getQuery(event)
          if (id) {
            return 'api_query_products_' + id
          }
        }

        return path
      },
    },
  }
})
```

:::

С этим все следующие запросы будут обработаны только изначально, а затем обслуживаться из кеша кешированным элементом `api_query_products_1`:

- /api/query/products?id=123
- /api/query/products?id=123&foobar=456
- /api/query/products?foobar=456&id=123
- /api/query/products?foobar=456&id=123&whatever=string&does=not&matter=at-all

### Изменение кешируемых заголовков

Вы можете определить метод, который получает заголовки ответа и возвращает измененные заголовки. Метод вызывается непосредственно перед записью ответа в кеш.

::: warning

По умолчанию все заголовки хранятся в кеше, потому что предполагается, что ваше приложение уже следит за тем, чтобы не помечать ответ как некешируемый во время рендеринга, если он содержит конфиденциальные заголовки, такие как Set-Cookie для аутентификации. Однако вы можете изменить заголовки, которые хранятся в кеше. Имейте в виду, что это может привести к побочным эффектам: Если вы используете `useCookie()` для установки cookie, а затем удаляете заголовок `Set-Cookie` с помощью этого подхода, только первый запрос фактически получит заголовок `Set-Cookie`. Все последующие запросы, обслуживаемые из кеша, не будут иметь этого заголовка.

Причина такого поведения в том, что для nuxt-multi-cache нет способа узнать, содержит ли заголовок конфиденциальную информацию или нет. Например, заголовок `Set-Cookie` может содержать безобидный cookie для установки текущей страны, который на самом деле может потребоваться кешировать.

Если вы хотите предотвратить кеширование маршрута, содержащего `Set-Cookie`, в первую очередь, вы должны убедиться, что маршрут помечен как некешируемый в этот момент, например, сразу после вызова `useCookie`.

:::

::: code-group

```typescript [multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    route: {
      alterCachedHeaders(headers) {
        // Удалить любой заголовок set-cookie из кеширования.
        headers['set-cookie'] = undefined

        // Или выполнять более детальные проверки, такие как проверка типа cookie.
        return headers
      },
    },
  }
})
```

:::

## Использование в компонентах

Используйте composable `useRouteCache` на странице, в layout или любом компоненте:

```vue
<template>
  <div>Эта страница кешируется на 1 час.</div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setMaxAge(3600).setCacheable().addTags(['page:1'])
})
</script>
```

По умолчанию страница не кешируется, вы должны явно вызвать `setCacheable()`.

Вы можете использовать composable несколько раз во время запроса. Exposed методы helper гарантируют отсутствие race conditions.

Обратите внимание, что вызов composable не возвращает значение. У вас есть доступ к `helper` только через callback. Причина в том, что это позволяет компилятору полностью удалить этот код из клиентских бандлов.

## Использование в Server Handlers

Composable не импортируется автоматически, и вы должны предоставить объект `H3Event` в качестве второго аргумента:

```typescript
import { useRouteCache } from '#imports'

const getResult = function () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: 'I am very delayed.' })
    }, 1000)
  })
}

export default defineEventHandler((event) => {
  useRouteCache((helper) => {
    helper.setCacheable()
  }, event)
  return getResult()
})
```

Первоначальный ответ займет 1 секунду, после чего ответ будет обслуживаться из кеша.

## Использование в других местах

Пока у вас есть доступ к текущему event запроса, вы можете импортировать composable и использовать его с event в качестве второго аргумента.

## Route Cache Helper

См. [useRouteCache](/ru/composables/useRouteCache).

## Разница с Nitro Cache

Nitro (и через него также Nuxt) уже поставляется с функцией кеширования маршрутов, используя либо [`routeRules`](https://nitro.unjs.io/config#routerules), либо [`defineCachedEventHandler`](https://nitro.unjs.io/guide/cache#cached-event-handlers). Однако это больше нацелено на простые случаи использования.

### Отсутствующие функции

#### Нет runtime кешируемости

Можно определить кешируемость только во время сборки. Это означает: Во время выполнения вы не можете решить, должен ли маршрут кешироваться или нет. Распространенный случай использования - отключить кеширование для авторизованных пользователей, что невозможно только с помощью Nitro.

При использовании route cache nuxt-multi-cache вы можете решить в любой момент во время запроса, должен ли ответ кешироваться, как долго, какие у него cache tags и т.д. Вы также можете реализовать то, что называется "kill switch", например, если backend-запрос не выполнен во время SSR, вы можете пометить ответ как некешируемый, после чего невозможно пометить его как кешируемый снова.

#### Нет очистки кеша

Хотя он поддерживает max age / TTL, нет встроенного способа очистить отдельные элементы кеша с использованием ключей или cache tags.

#### Нет cache tags

Нет концепции cache tags, поэтому очистка должна выполняться либо путем очистки всего, либо на основе ключа (например, wildcard matching, `/products/*`).

#### Глобальные переопределения

Нет простого способа определить глобальные переопределения, такие как глобальный префикс ключа кеша, полное отключение кеширования на время запроса и т.д.

### Стоит ли использовать nuxt-multi-cache?

Если ваши потребности покрываются встроенным кешированием Nitro, то вам, вероятно, не следует использовать route cache nuxt-multi-cache, потому что это вносит дополнительный уровень сложности, который оправдан только если вам действительно нужны дополнительные функции.

### Использование обоих кешей вместе

Технически возможно использовать как кеш Nitro, так и route cache nuxt-multi-cache одновременно, потому что они работают совершенно по-разному:

- Nitro решает на основе каждого event handler, может ли он быть кеширован при использовании `defineCachedEventHandler` или проверяя `routeRules`.
- Этот модуль вместо этого подключается к жизненному циклу запроса: Когда вызывается хук `request` (до выполнения любого event handler), он уже пытается обслужить из кеша. И аналогично, когда вызывается хук `afterResponse`, он помещает ответ в кеш.
