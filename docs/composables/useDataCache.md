# useDataCache

Available in **Nuxt** and **Nitro**.

This composable is available if the [Data Cache feature](/features/data-cache)
is enabled. It allows you to store anything in cache.

The data cache only works on the server. On the client, `value` is always
`undefined` and `addToCache` does nothing.

## Full Example

```typescript
const route = useRoute()
const userId = route.params.id

const key = computed(() => 'get-user-' + userId)

const { data: weather } = await useAsyncData(async () => {
  const { value, addToCache } = await useDataCache(key.value)
  // Data is available from cache.
  // The value object has the correct type if provided.
  if (value) {
    return value
  }

  // Fetch data and add it to cache.
  const response = await $fetch('/api/get-user/' + userId)

  // Add it to cache, also providing cache tags and a max age.
  await addToCache(response, ['user:' + userId], 3600)
  return response
})
```

## Arguments

### key: `string`

The key for the cache item. The storage normalizes it, and a key with a `?` is
not cached at all (see [Cache Keys](/advanced/cache-backend#cache-keys)).

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

### options?: `{ bubbleCacheability?: BubbleCacheability }`

Set `bubbleCacheability` to merge the max age, stale if error duration and cache
tags of the item into the route cache and/or the CDN headers of the current
request. See [Bubbling Cacheability](/overview/bubble-cacheability).

```typescript
const { value, addToCache } = await useDataCache('weather', null, {
  bubbleCacheability: true,
})
```

## Return Value

The composable returns a Promise that resolves to an object with the following
properties:

### value: `T|undefined`

The value from cache if found. The type is generic, you can provide it when
calling `useDataCache`:

```typescript
const { value } = await useDataCache<WeatherResponse>('weather')
```

If the cached value can be falsy (such as `0`, `false`, `''` or `null`), check
for `value !== undefined` instead of `if (value)`, so that a cached falsy value
is returned from cache.

### addToCache: `(data: any, tags?: string[], maxAge?: MaxAge, staleIfError?: MaxAge)`

Use this method to add data to the cache for the given key. The data should be a
string or an object that can be stringified to JSON.

The optional second argument allows you to define cache tags which can be later
used to invalidate a cache item.

With the optional third argument you can define a [max age](/overview/max-age)
for the cache item. Without a max age, the item is cached permanently. A max age
of `0` (or `'never'`) means the item is not cached, unless a stale if error
duration is set.

With the optional fourth argument you can define how long the item can be
returned as `staleValue` after it expired. See
[Stale if Error](/overview/stale-if-error#data-cache).

### staleValue: `T|undefined`

The cached value, if the item is expired, but still within its stale if error
duration. Use it as a fallback if loading the data fails.

### cacheTags: `string[]`

The cache tags of the cached item, or an empty array.

### expires: `number|undefined`

The time when the cached item expires, as a unix timestamp in seconds. `-1` if
the item doesn't expire, `0` if it is only stored as a stale value and
`undefined` if nothing is cached.
