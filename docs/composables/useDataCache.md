# useDataCache

Available in **Nuxt** and **Nitro**.

This composable is available if the [Data Cache feature](/features/data-cache)
is enabled. It allows you to store anything in cache.

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

The key for the cache item.

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

## Return Value

The composable returns a Promise that resolves to an object with the following
properties:

### value: `T|undefined`

The value from cache if found. The type is generic, you can provide it when
calling `useDataCache`:

```typescript
const { value } = await useDataCache<WeatherResponse>('weather')
```

### addToCache: `(data: any, tags?: string[], maxAge?: number)`

Use this method to add data to the cache for the given key. The data should be a
string or an object that can be stringified to JSON.

The optional second argument allows you to define cache tags which can be later
used to invalidate a cache item.

With the optional third argument you can define a max age for the cache item.
