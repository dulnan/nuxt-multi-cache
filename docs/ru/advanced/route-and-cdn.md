# Использование Route Cache и CDN Headers вместе

Поскольку каждая функция работает независимо, можно использовать route cache и функцию CDN заголовков одновременно.

::: warning

Поскольку обе функции работают независимо, установка max age через useRouteCache не влияет на max age заголовка CDN cache control и наоборот.

:::

## Пример

Решение в middleware, где должна кешироваться страница.

```typescript
import { useCDNHeaders } from '#imports'
import { getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/dashboard')) {
    // Страница будет кешироваться локально в route cache.
    useCDNHeaders((v) => v.private())
    useRouteCache((v) => v.setCacheable())
  } else {
    // Страница будет кешироваться на CDN.
    useCDNHeaders((v) => v.public())
    useRouteCache((v) => v.setUncacheable())
  }
})
```
