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
  return useDataCacheCallback(key.value, async () => {
    const value = await $fetch('/api/get-user/' + userId)

    // You must return an object with a `value` property.
    // Optionally, you can also return cache tags and a max age.
    return {
      value,
      cacheTags: ['user:' + userId],
      maxAge: 60 * 60,
    }
  })
})
```

The callback is only executed once on the server. For every subsequent request
in the next 60 minutes, it will return the value from cache, or until the
`user:*` cache tag is purged.

## Arguments

### key: `string`

The key for the cache item.

### cb?: `() => Promise<{ value: T; cacheTags?: string[]; maxAge?: number }>`

The callback is called whenever nothing in the cache exists. It is expected to
return an object with at least a `value` property. You may optionally also
return `cacheTags` and `maxAge` properties.

### event?: `H3Event`

The optional `H3Event` event. This is not needed when the composable is called
in a Nuxt app context (e.g. plugin, other composables, component).

When called in a Nitro server context, the argument is required.

## Return Value

The method will return the `value` property returned by your callback:

```typescript
const data = await useDataCacheCallback('users', async () => {
  return {
    value: [
      {
        firstName: 'John',
        lastName: 'Wayne',
      },
    ],
    maxAge: 60 * 60,
    cacheTags: ['users'],
  }
})

console.log(data)
// [{ firstName: "John", lastName: "Wayne" }]
```
