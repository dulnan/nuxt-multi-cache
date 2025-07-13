# useDataCacheCallback

Available in **Nuxt** and **Nitro**.

This composable is available if the [Data Cache feature](/features/data-cache)
is enabled. It will call the provided callback only once and afterwards return
the value from cache.

## Full Example

```typescript
const route = useRoute()
const userId = route.params.id

const key = computed(() => 'get-user-' + userId)

const { data } = await useAsyncData(() => {
  // Will be cached on the server.
  // On the client, it will always be executed.
  // The method returns the value of `value` returned by the callback.
  return useDataCacheCallback(key.value, async (cache) => {
    const value = await $fetch('/api/get-user/' + userId)

    // The cache helper is only available on the server.
    // It's recommended to also check for "import.meta.server", so that the
    // code inside is removed from client bundles.
    if (cache && import.meta.server) {
      cache.addTags(['user:' + userId]).setMaxAge('1h')
    }

    return value
  })
})
```

The callback is only executed once on the server. For every subsequent request
in the next 60 minutes, it will return the value from cache, or until the
`user:*` cache tag is purged.

## Arguments

### key: `string`

The key for the cache item.

### cb?: `(cache?: DataCacheHelper) => Promise<T>`

The callback is called whenever nothing in the cache exists or if the item in
the cache is expired. The value you return will be put in the cache.

The callback also receives the _cache helper_ as an argument. The cache helper
is only available on the server. The helper provides methods to control the
cacheability:

```typescript
const data = await useDataCacheCallback(
  'data-cache-callback-key',
  function (helper) {
    if (helper && import.meta.server) {
      // Add cache tags.
      helper.addTags(['one', 'two', 'three'])

      // Revalidate after 4 hours.
      helper.setMaxAge('4h')

      // Allows the composable to return a stale value for up to one day if
      // this callback throws an error.
      helper.setStaleIfError('1d')
    }

    return {
      timestamp: Date.now(),
    }
  },
)
```

It's recommended to wrap calls to helper methods in
`if (helper && import.meta.server)`, so that the entire if block can be removed
from client bundles.

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

## Return Value

The method will return the value from your callback.

```typescript
const data = await useDataCacheCallback('users', async (cache) => {
  if (cache && import.meta.server) {
    cache.addTags('users').setMaxAge('1h')
  }

  return {
    firstName: 'John',
    lastName: 'Wayne',
  }
})

console.log(data)
// [{ firstName: "John", lastName: "Wayne" }]
```
