# Cache Tags

Cache tags allow you to easily invalidate one or more "related" items across
caches.

## Basics

A cache tag is a unique identifier of something like a page, an image or any
context:

- `article:235`
- `language:de`
- `image:313`
- `config:site:page_title`
- `image_style:hero_large_retina`

Typically, cache tags are provided by a backend (such as a CMS), but they can
also be managed directly by your app.

If cache tags are provided by a backend it's likelay also the backend that will
automatically invalidate the appropriate cache tags when needed.
nuxt-multi-cache offers an
[API endpoint to purge one or more cache tags](/features/api#purge-tags).

## Integration

The [component cache](/features/component-cache),
[data cache](/features/data-cache) and [route cache](/features/route-cache)
provide a way to store cache tags along the cached item:

### Component Cache

You can either provide cache tags on the `<RenderCacheable>` component:

```vue
<template>
  <div>
    <RenderCacheable :cache-tags="['weather']">
      <Weather />
    </RenderCacheable>
  </div>
</template>
```

or by using the [useComponentCache](/composables/useComponentCache) composable:

```typescript
useComponentCache((helper) => {
  helper.addTags(['weather'])
})
```

### Data Cache

Cache tags can be added via the `addToCache` method returned by
[useDataCache](/composables/useDataCache):

```typescript
const { value, addToCache } = await useDataCache<WeatherResponse>('weather')
if (value) {
  return value
}

const response = await $fetch<WeatherResponse>('/api/getWeather')
await addToCache(response, ['weather'])
```

### Route Cache

You can add cache tags using the [useRouteCache](/composables/useRouteCache)
composable:

```typescript
useRouteCache((helper) => {
  helper.addTags(['weather'])
})
```

## Purging

The [API](/features/api) offers an endpoint to purge items by cache tag.

Using the three examples from above, you can invalidate the cached data,
component and route all at once:

```sh
curl -X POST -i \
  -H "Content-Type: application/json" \
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["weather"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

By default, cache tags are not invalidated immediately, but after a fixed delay
that can be configured
[via api.cacheTagInvalidationDelay](/overview/configuration) in the module
options.

After the delay, all three items are removed from the cache.

## Cache Tag Registry

By default, in order to "know" which items to purge from the cache when tags are
invalidated, the module iterates over all cache items and parses them to be able
to match their cache tags with the tags to invalidate. While this might work for
small to medium amount of cached items, it does not scale for large applications
with potentially thousands of cache items and tags.

The job of the _Cache Tag Registry_ is to provide a fast and efficient way to
look up which cache keys to delete when one or more cache tags are invalidated.

### Using the built-in in-memory registry

You can enable the built-in cache tag registry in your
[server options](/overview/server-options) file:

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagRegistry: 'in-memory',
  }
})
```

:::

::: warning External Caches

The in-memory cache tag registry only works when **all** cache storages are also
in-memory! If you use redis, valkey or any other _external_ cache driver, it
will only work as long as both your app and the cache backend are in sync.

If you restart your app without also purging the external cache, your app will
not have any knowledge about the cache tags of your (still cached) items.

:::

::: warning Multiple Instances

When you run your app in multiple instances (e.g. via
[PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), keep in
mind that each instance will track its own cache items and tags; purging via the
API will only affect a random instance.

:::

### Custom Implementation

Provide an object in `cacheTagRegistry` that implements the
[type.CacheTagRegistry] interface.

You can use the built-in in-memory registry implementation as a reference:

<<< @/../src/runtime/helpers/InMemoryCacheTagRegistry.ts

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { InMemoryCacheTagRegistry } from './registry'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagRegistry: new InMemoryCacheTagRegistry(),
  }
})
```

:::

## Cache Tag Invalidator

The _Cache Tag Invalidator_ is responsible for managing the invalidation of
cache tags. When cache tags are added via the `add()` method, the invalidator
decides when and how to invalidate the corresponding cache items.

By default, the module uses an in-memory invalidator with debounced invalidation
to prevent performance issues from too many invalidation requests at once.

### Using the built-in in-memory invalidator

The built-in invalidator is used by default. You can explicitly configure it:

::: code-group

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagInvalidator: 'in-memory',
  }
})
```

:::

### Custom Implementation

Provide a factory function in `cacheTagInvalidator` that returns an object
implementing the [type.CacheTagInvalidator] interface.

The factory function receives:

- `cache` - All cache instances (data, route, component)
- `cacheTagRegistry` - The configured cache tag registry (if any)

This allows you to:

- Store the tags buffer in custom storage (MongoDB, Redis, etc.)
- Implement custom invalidation logic (debounce, queue, immediate, etc.)
- Add logging, metrics, or monitoring
- Integrate with external invalidation systems

You can use the built-in in-memory invalidator implementation as a reference:

<<< @/../src/runtime/helpers/InMemoryCacheTagInvalidator.ts

::: code-group

```typescript [~/server/lib/MongoCacheTagInvalidator.ts]
import type {
  CacheTagInvalidator,
  MultiCacheInstances,
  CacheTagRegistry,
} from 'nuxt-multi-cache'

export class MongoCacheTagInvalidator implements CacheTagInvalidator {
  private invalidationTimeout: NodeJS.Timeout | null = null

  constructor(
    private cache: MultiCacheInstances,
    private registry: CacheTagRegistry | null,
    private mongoCollection: Collection,
  ) {}

  add(tags: string[]): void {
    // Store tags in MongoDB for persistence across restarts
    this.mongoCollection.insertMany(
      tags.map((tag) => ({
        tag,
        timestamp: Date.now(),
        status: 'pending',
      })),
    )

    // Schedule invalidation with custom delay
    if (!this.invalidationTimeout) {
      this.invalidationTimeout = setTimeout(() => {
        this.invalidate()
      }, 5000) // Custom 5 second delay
    }
  }

  private async invalidate() {
    // Get pending tags from MongoDB
    const pendingTags = await this.mongoCollection
      .find({ status: 'pending' })
      .toArray()

    const tags = pendingTags.map((doc) => doc.tag)

    // Use registry if available for efficient invalidation
    if (this.registry) {
      const invalidationMap = await this.registry.getCacheKeysForTags(tags)

      for (const [cacheType, keys] of Object.entries(invalidationMap)) {
        const cache = this.cache[cacheType as keyof MultiCacheInstances]
        if (cache) {
          for (const key of keys) {
            await cache.storage.removeItem(key)
          }
        }
      }

      await this.registry.removeTags(tags)
    }

    // Mark tags as processed in MongoDB
    await this.mongoCollection.updateMany(
      { status: 'pending' },
      { $set: { status: 'processed', processedAt: Date.now() } },
    )

    this.invalidationTimeout = null
  }
}
```

```typescript [~/server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import { MongoCacheTagInvalidator } from './lib/MongoCacheTagInvalidator'
import { getMongoCollection } from './lib/mongo'

export default defineMultiCacheOptions(() => {
  return {
    cacheTagInvalidator: (cache, cacheTagRegistry) => {
      const mongoCollection = getMongoCollection('cache_tags')
      return new MongoCacheTagInvalidator(cache, cacheTagRegistry, mongoCollection)
    },
  }
})
```

:::

::: warning Multiple Instances

When running your app in multiple instances (e.g. via
[PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), make
sure your custom invalidator implementation can handle cross-instance
synchronization. The built-in in-memory invalidator only works within a single
instance.

:::
