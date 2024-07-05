# useCachedAsyncData

Helper composable to use
[useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) together
with [useDataCache](/composables/useDataCache).

```typescript
const { data: weather } = await useCachedAsyncData('users', () =>
  $fetch('/api/users'),
)
```

## Full example

```typescript
const { data: users } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    maxAge: 60 * 60,
    cacheTags: function (data) {
      return data.cacheTags
    },
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

The type extend `AsyncDataOptions` from Nuxt and adds two additional properties:

#### maxAge?: `((v: ResT) => number|undefined) | number`

The max age for the cache item. Can either be a method or a value.

When a method is defined, it receives the result of your handler as the first
argument and should return a number.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Cache for 3600 seconds (1 hour).
    maxAge: 60 * 60,
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Use the max age coming from the API response.
    maxAge: (data) => data.maxAge,
  },
)
```

#### cacheTags?: `((v: ResT) => string[]|undefined) | string[]`

The cache tags for the cache item. Can either be a method or a value.

When a method is defined, it receives the result of your handler as the first
argument and should return a value.

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Hardcoded cache tags.
    cacheTags: ['users-list'],
  },
)
```

```typescript
const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch('/api/users'),
  {
    // Use the cache tags coming from the API response.
    cacheTags: (data) => data.cacheTags,
  },
)
```
