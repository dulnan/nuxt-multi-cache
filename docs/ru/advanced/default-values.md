# Определение значений по умолчанию для Route Cache / CDN

Вы могли заметить, что нет способа предоставить "кешируемость по умолчанию" через конфигурацию. Это потому, что модуль по умолчанию ничего не кеширует.

Однако существует несколько способов определить кешируемость по умолчанию, в зависимости от случая использования. Все они работают для каждого запроса.

## Использование глобального префикса ключа кеша

Можно автоматически добавлять префикс ко всем ключам кеша с помощью статического или динамического ключа, используя [опцию cacheKeyPrefix](/ru/overview/server-options#use-a-global-cache-prefix).

## Route Cache

### Для Nuxt страниц

Если вы хотите кешировать все Nuxt страницы по умолчанию, вы можете использовать composable `useRouteCache` в вашем `app.vue`, который будет выполняться для каждой страницы.

::: code-group

```vue [app.vue]
<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(604800)
})
</script>
```

:::

### Для любого маршрута

Если вы дополнительно хотите включить пользовательские API маршруты, вы можете определить [server middleware](https://nuxt.com/docs/guide/directory-structure/server#server-middleware):

::: code-group

```typescript [./server/middleware/routeCache.ts]
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  // Кешировать все маршруты на 7 дней.
  useRouteCache((helper) => {
    helper.setCacheable().setMaxAge(604800)
  }, event)
})
```

:::

Это будет выполняться для каждого запроса, включая Nuxt страницы и серверные маршруты.

## Component Cache

Значения по умолчанию для props компонента `<RenderCacheable>` являются falsy. Если вам нужно изменять ключ кеша на основе глобальных вещей, таких как текущий язык, домен, валюта и т.д., вы можете создать свою собственную обертку:

::: code-group

```vue [ContextAwareCacheable.vue]
<template>
  <RenderCacheable :cache-key="cacheKey">
    <slot></slot>
  </RenderCacheable>
</template>

<script lang="ts" setup>
const store = useStore()

const cacheKey = computed(() => {
  return [store.language, store.currency, store.domain].join('_')
})
</script>
```

:::

Или, более чистым способом было бы создать composable:

::: code-group

```typescript [./composables/useGlobalContextKey.ts]
export default async function (suffix: string): string | undefined {
  // Убедитесь, что остальной код не попадает в клиентский бандл.
  if (import.meta.client) {
    return
  }

  const store = useStore()
  return [store.language, store.currency, store.domain, suffix].join('_')
}
```

:::

И затем использовать его так:

```vue
<template>
  <RenderCacheable :cache-key>
    <Navbar />
  </RenderCacheable>
</template>

<script lang="ts" setup>
const store = useStore()

const cacheKey = useGlobalContextKey('additional-suffix')
</script>
```

## CDN Cache Control

Это работает точно так же, как с route cache, только используя composable `useCDNHeaders`:

### Для страниц

::: code-group

```vue [app.vue]
<template>
  <div class="app">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
useCDNHeaders((helper) => {
  helper.public().setMaxAge(604800)
})
</script>
```

:::

### Для любого маршрута

::: code-group

```typescript [./server/middleware/routeCache.ts]
import { useRouteCache } from '#imports'

export default defineEventHandler((event) => {
  useCDNHeaders((helper) => {
    helper.public().setMaxAge(604800)
  }, event)
})
```

:::
