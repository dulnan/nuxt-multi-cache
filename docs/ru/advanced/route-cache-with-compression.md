# Использование Route Cache с компрессией

Можно использовать route cache вместе с компрессией, например, с библиотекой [h3-fast-compression](https://github.com/TimGonnet/h3-fast-compression?tab=readme-ov-file#benchmarks) или [h3-compression](https://github.com/CodeDredd/h3-compression). Вы можете сжимать как Nuxt-отрендеренные страницы, так и ответы от server handlers.

::: warning

Существуют различия в производительности между этими двумя библиотеками, и рекомендуется использовать `h3-fast-compression`. См. [этот issue](https://github.com/dulnan/nuxt-multi-cache/issues/96) для получения дополнительной информации.

:::

Однако, из-за того, как работают и этот модуль, и эти библиотеки, вы не можете использовать компрессию **внутри event handler**, по той простой причине, что ваш event handler вызывается только один раз, когда ответ сохраняется в кеш. После этого кешированный ответ возвращается немедленно. Конечно, вы все еще можете продолжать использовать компрессию в event handler, но просто не вместе с route cache.

По этой причине вы должны сжимать ответы глобально, через [хук Nitro `beforeResponse`](https://nitro.unjs.io/guide/plugins#available-hooks). Это **единственный хук**, который гарантированно работает; использование **`render:response` не будет** работать, потому что этот хук вызывается только при первом рендеринге маршрута.

::: info

Хотя вы можете использовать компрессию из вашего приложения таким образом, альтернативным подходом было бы обработать это напрямую на вашем веб-сервере, используя [mod_deflate для Apache](https://httpd.apache.org/docs/current/mod/mod_deflate.html) или установив [`gzip on` в nginx](https://docs.nginx.com/nginx/admin-guide/web-server/compression/).

:::

## Пример

### Сжимать только конкретные маршруты

::: code-group

```typescript [./server/plugins/compression.ts]
import { useCompression } from 'h3-fast-compression'
import { getRequestURL } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const url = getRequestURL(event)
    // Предотвратить сжатие некоторых путей.
    if (url.pathname.startsWith('/no-compression')) {
      return
    }

    await useCompression(event, response)
  })
})
```

:::

### Сжимать только конкретные content types

::: code-group

```typescript [./server/plugins/compression.ts]
import { useCompression } from 'h3-fast-compression'
import { getRequestURL } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const headerValue = getResponseHeader(event, 'content-type')
    const contentType = Array.isArray(headerValue) ? headerValue : [headerValue]
    const isApplicable = contentType.find(
      (v) => typeof v === 'string' && v.includes('text/html'),
    )
    if (isApplicable) {
      await useCompression(event, response)
    }
  })
})
```

:::
