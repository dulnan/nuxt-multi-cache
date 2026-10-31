# Cache Management API

This feature provides several API endpoints to manage the caches. You can get a
list of cache items, inspect cache items, delete items by key or delete items by
cache tags.

## Configuration

::: code-group

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    api: {
      enabled: true,
      prefix: '/__nuxt_multi_cache',
      // Token based authorization. Leave it out to use the authorization
      // callback from the server options instead.
      authorization: 'hunter2',
      cacheTagInvalidationDelay: 60000,
    },
  },
})
```

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { isAuthenticated } from './somewhere'

export default defineMultiCacheOptions(() => {
  return {
    api: {
      // Use a custom method that checks authorization. Can be something like
      // cookie, basic auth or request IP. Only used if no token is set.
      authorization: async function (event) {
        return await isAuthenticated(event)
      },
    },
  }
})
```

:::

### Authorization

By default the endpoints are not accessible without authorization.

#### Token based (x-nuxt-multi-cache-token)

This is the default authorization used when the `api.authorization` option is
provided. In this case the token is expected in the `x-nuxt-multi-cache-token`
header:

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/component', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nuxt-multi-cache-token': 'hunter2', // [!code focus]
  },
  body: JSON.stringify(['Navbar::de--chf']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

:::

It's also possible to
[provide the token using runtime config](/overview/runtime-config#api-authorization-token):

```dotenv
NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN=PtSR0mDATQpNlvNgqRf
```

#### Custom Callback

You can also implement your own
[authorization check via the server options](/overview/server-options#custom-api-authorization).
In this case, leave out the `api.authorization` module option.

If no authorization is configured at all, the endpoints respond with a 500
error.

#### Disabled

You can disable authorization by setting the value of `api.authorization` to
`false`. **Only do this if the endpoints are not accessible publicly!**

## Purge Everything

Purges everything from all caches.

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/all', {
  method: 'POST',
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -X POST -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/purge/all
```

:::

::: details Response

```json
{
  "status": "OK"
}
```

:::

## Purge Item

Purge one or more cache items by key. The last part of the path is the name of
the cache: `component`, `data` or `route`. If the cache is not enabled, the
endpoint responds with a 404 status code.

The keys must be the keys as they are stored, including the
[global cache prefix](/overview/server-options#use-a-global-cache-prefix) if one
is set. You can find them using [Get Stats](#get-stats).

The `affectedKeys` in the response are the keys from the request, whether an
item existed for them or not.

### Example: Purge component with key `Navbar::de--chf`

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/component', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['Navbar::de--chf']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

:::

::: details Response

```json
{
  "status": "OK",
  "affectedKeys": ["Navbar::de--chf"]
}
```

:::

### Example: Purge two specific pages

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/route', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['/about', '/product/123']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["/about", "/product/123"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/route
```

:::

::: details Response

```json
{
  "status": "OK",
  "affectedKeys": ["/about", "/product/123"]
}
```

:::

## Purge Tags

Purge cache items by cache tags.

::: info

All tags are collected for some time (default: 1min), after which the cache
items are purged. This is because cache tags are stored together with the items.
Unless a [cache tag registry](/overview/cache-tags#cache-tag-registry) is used,
every item needs to be loaded from the cache and its tags checked.

The delay is configurable via the `api.cacheTagInvalidationDelay` option (in
milliseconds). Set it to `0` to purge the items right after the request, without
collecting tags.

:::

### Example Purge all cache items with cache tag `language:de`

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/purge/tags', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-nuxt-multi-cache-token': 'hunter2',
  },
  body: JSON.stringify(['language:de']),
})
```

```bash [curl]
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

:::

::: details Response

```json
{
  "status": "OK",
  "tags": ["language:de"]
}
```

:::

## Get Stats

Get a list of all items in a cache.

### Example: Get a list of all cached components

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/stats/component', {
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/stats/component
```

:::

::: details Response

```json
{
  "status": "OK",
  "rows": [
    {
      "key": "Navbar::de--chf",
      "data": "{\"payload\":{},\"cacheTags\":[\"navbar\"],\"ssrModules\":[\"components/Navbar.vue\"],\"expires\":-1,\"staleIfErrorExpires\":0}<CACHE_ITEM><nav class=\"navbar\">...</nav>"
    }
  ],
  "total": 1
}
```

:::

Items of the component and route cache are stored as a string: Their metadata as
JSON, followed by `<CACHE_ITEM>` and the markup or response body. Items of the
data cache are stored as objects.

## Inspect

Inspect a cache item. The key should be provided as a query param `key`. If no
item exists for the key, the endpoint responds with a 404 status code.

The item is returned as it is stored (see [Get Stats](#get-stats)).

### Example: Get the cached component with key `Navbar::de--chf`

::: code-group

```typescript [fetch]
fetch(
  'http://localhost:3000/__nuxt_multi_cache/inspect/component?key=Navbar::de--chf',
  {
    headers: {
      'x-nuxt-multi-cache-token': 'hunter2',
    },
  },
)
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  "http://localhost:3000/__nuxt_multi_cache/inspect/component?key=Navbar::de--chf"
```

:::

::: details Response

```
{"payload":{},"cacheTags":["navbar"],"ssrModules":["components/Navbar.vue"],"expires":-1,"staleIfErrorExpires":0}<CACHE_ITEM><nav class="navbar">...</nav>
```

:::

### Example: Get the details of a cached route

::: code-group

```typescript [fetch]
fetch('http://localhost:3000/__nuxt_multi_cache/inspect/route?key=api:test', {
  headers: {
    'x-nuxt-multi-cache-token': 'hunter2',
  },
})
```

```bash [curl]
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  "http://localhost:3000/__nuxt_multi_cache/inspect/route?key=api:test"
```

:::

::: details Response

```
{"headers":{"cache-tag":"page:1 language","surrogate-control":"max-age=3600, public","content-type":"application/json"},"statusCode":200,"expires":1793382047,"cacheTags":["page:1","language"],"staleIfErrorExpires":0,"staleWhileRevalidate":false}<CACHE_ITEM>{"api":"This is data from the API."}
```

:::
