# useCachedAsyncData

Only available in **Nuxt**.

Helper composable to use
[useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) together
with [useDataCache](/composables/useDataCache), with optional client-side
caching.

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    clientMaxAge: 'permanent',
    serverMaxAge: 'permanent',
  },
)
```

## Full example

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Cache for an hour on the server.
    serverMaxAge: 60 * 60,

    // Add a tag to make it possible to invalidate the cache item.
    serverCacheTags: ['users-list'],

    // Allow the client/browser to cache it for 10 minutes.
    clientMaxAge: 10 * 60,

    // Transform the data. The transformed data will be put in the cache.
    transform: function (data) {
      return data.users
    },
  },
)
```

The function signature is identical with useAsyncData, but the first argument
`key` is always required.

## Arguments

### key: `string`

The key which is used for getting/setting the data cache item.

### handler: `(app?: NuxtApp) => Promise<ResT>`

The handler, usually to fetch some data. The result of the handler will be
cached.

### options: `CachedAsyncDataOptions`

The type extends `AsyncDataOptions` from Nuxt and adds three additional
properties:

#### clientMaxAge?: `number`

By default, the composable will only cache server-side and will not do any
client-side caching. This can be changed by providing a `clientMaxAge` value. In
this case, the composable will store the result in `nuxtApp.static.data` and
will return cached data for the given duration.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Cache this request for 10 minutes.
    clientMaxAge: 60 * 10,
    serverMaxAge: 'midnight',
  },
)
```

You can invalidate the cache by calling `refresh()` or `clear()`:

```typescript
const { data, refresh } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    clientMaxAge: 60 * 10,
    serverMaxAge: 'never',
  },
)

async function createNewUser() {
  await $fetch('/api/create-user')
  // Force refresh, which will refetch the data and store it in cache again.
  await refresh()
}
```

#### serverMaxAge?: `((v: ResT) => number|undefined) | number`

The max age for the cache item. Can either be a method or a value.

When a method is defined, it receives the result of your handler as the first
argument and should return a number.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Cache for 3600 seconds (1 hour).
    serverMaxAge: 60 * 60,
    clientMaxAge: 'never',
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Use the max age coming from the API response.
    serverMaxAge: (data) => data.maxAge,
    clientMaxAge: 'never',
  },
)
```

#### serverCacheTags?: `((v: ResT) => string[]|undefined) | string[]`

The cache tags for the cache item. Can either be a method or a value.

When a method is defined, it receives the result of your handler as the first
argument and should return a value.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Hardcoded cache tags.
    serverCacheTags: ['users-list'],
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Use the cache tags coming from the API response.
    serverCacheTags: (data) => data.cacheTags,
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```

## Tips

### Use the `transform` option

The composable will cache the result of the `transform` method, so that the
method is only called once. This applies for both client- and server-side
caching. This also helps to make the cache item smaller.

For example, here we load the entire list of users, but we only need some
properties. By implementing a transform method, we can significantly reduce the
size of both the payload and the cache item:

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users-emails',
  () => $fetch('/api/users'),
  {
    serverMaxAge: 60 * 60,
    clientMaxAge: 10 * 60,
    transform: function (data) {
      return data.users.map((v) => {
        return {
          id: v.id,
          email: v.email,
        }
      })
    },
  },
)
```

### Make sure there are no side effects

Inside your composable handler or the `transform` method, you should not mutate
any values outside these methods, because they will not be executed when the
composable returns something from cache.

### Make sure the key is unique

The key you provide is used as-is for the cache item. Make sure that this key is
unique or else you might experience unexpected behaviour:

```typescript
// We fetch some data and store it in the cache.
const { value, addToCache } = await useDataCache('all-users')
if (!value) {
  const data = await $fetch('/api/users')
  await addToCache(data)
}

// Later we reuse the same key, but the fetch is different.
// Because there is already a cache item with this key, it will return this one,
// which will lead to unexpected behaviour.
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/user-emails'),
  {
    clientMaxAge: 'never',
    serverMaxAge: 'permanent',
  },
)
```
