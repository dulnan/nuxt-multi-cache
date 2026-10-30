# Условное включение кеширования

Если хотите, вы можете определить метод, который решает для каждого запроса, должно ли быть включено кеширование. Этот метод выполняется на самой ранней возможной стадии, до выполнения любых других функций кеширования.

::: info

Это влияет только на component, data и route кеши. Функция CDN Cache Control продолжает работать.

:::

## Конфигурация

::: code-group

```typescript [./server/multiCache.serverOptions.ts]
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
