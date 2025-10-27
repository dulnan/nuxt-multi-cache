# Cache Backend

Этот модуль использует [unstorage](https://github.com/unjs/unstorage) для обработки слоя кеша. Это означает, что можно использовать любой backend кеша. По умолчанию используется `memory` backend.

Если Nuxt приложение запускается в нескольких экземплярах, вы больше не можете использовать memory cache, поскольку очистка кеша через API затронет только один экземпляр. Чтобы решить эту проблему, вы должны использовать внешний backend кеша.

## Пример использования Redis

Этот минимальный пример использует [Redis driver](https://github.com/unjs/unstorage/blob/main/src/drivers/redis.ts), предоставляемый unstorage.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import redisDriver from 'unstorage/drivers/redis'

export default defineMultiCacheOptions(() => {
  return {
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

## Пользовательский драйвер

Ознакомьтесь с полным примером [как создать пользовательский драйвер](https://github.com/unjs/unstorage#making-custom-drivers).

Этот пример воссоздает хранилище по умолчанию (in-memory), используя простой объект `cache`.

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { defineDriver } from 'unstorage'

const customDriver = defineDriver((_opts) => {
  let cache = {}
  return {
    hasItem(key: string) {
      return !!cache[key]
    },
    getItem(key: string) {
      return cache[key]
    },
    setItem(key, value) {
      return (cache[key] = value)
    },
    removeItem(key) {
      cache[key] = undefined
    },
    getKeys() {
      return Object.keys(cache)
    },
    clear() {
      cache = {}
    },
    dispose() {},
  }
})

export default defineMultiCacheOptions(() => {
  return {
    component: {
      storage: {
        driver: customDriver(),
      },
    },
  }
})
```

:::
