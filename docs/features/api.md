# Cache Management API

This feature provides several API endpoints to manage the caches. You can get a
list of cache items, inspect cache items, delete items by key or delete items
by cache tags.

## Configuration

```typescript
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    api: {
      enabled: true,
      prefix: '/__nuxt_multi_cache',
      authorization: 'hunter2',
      cacheTagInvalidationDelay: 60000
    }
  }
}
```

### Authorization

By default the endpoints are not accesible without authorization.

#### Token based (x-nuxt-multi-cache-token)

This is the authorization used when the provided `api.authorization` value is a
string. In this case the token is expected in the `x-nuxt-multi-cache-token`
header:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \ // [!code focus]
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

#### Custom Callback

If the value of `api.authorization` is a function, then this is executed for
each request to the API. The function receives the `H3Event` object as an
argument and can then decide if authorization is granted by returning a Promise
that resolves to `true` or `false`.

#### Disabled

You can disable authorization by setting the value of `api.authorization` to
`false`. **Only do this if the endpoints are not accessible publicly!**


## Purge Everything

Purges everything from all caches.

```bash
curl -X POST -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/purge/all
```

## Purge Item

Purge one or more cache items by key.

**Example:** Purge component with key `Navbar::de--chf`:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["Navbar::de--chf"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/component
```

**Example:** Purge two specific pages:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["/about", "/product/123"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/route
```

## Purge Tags

Purge cache items by cache tags.

::: info
All tags are collected for some time (default: 1min), after which
the cache items are purged. This is because cache tags are stored together with
the items. This means that every item needs to be loaded from the cache and its
tags checked.

The delay is configurable via the `api.cacheTagInvalidationDelay` option.
:::

**Example:** Purge all cache items with cache tag `language:de`:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["language:de"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

## Get Stats

Get a list of all items in a cache.

**Example:** Get a list of all cached components:

```bash
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/stats/component
```

## Inspect

Inspect a cache item. The key should be provided as a query param `key`.

**Example:** Get the markup of the cached component with key `Navbar::de`.

```bash
curl -i \
  -H "x-nuxt-multi-cache-token: hunter2" \
  http://localhost:3000/__nuxt_multi_cache/inspect/component?key=Navbar::de
```

