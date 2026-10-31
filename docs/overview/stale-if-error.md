# Stale if Error

All caches support _stale if error_ behaviour. This allows them to return
expired stale cache items if an error happens during revalidation.

## Data Cache

The [useDataCache](/composables/useDataCache) composable returns a `staleValue`
if:

- The data was cached by providing the `staleIfError` argument in `addToCache`
- The cached data is still within the `staleIfError` range

```typescript
async function loadUser(userId: string): Promise<User> {
  const { value, addToCache, staleValue } = await useDataCache<User>(
    'user:' + userId,
  )

  // A valid, non-stale value exists in the cache.
  if (value) {
    return value
  }

  try {
    const response = await $fetch<User>('/api/get-user/' + userId)

    await addToCache(
      // The object we want to cache.
      response,
      // The cache tags.
      ['user:' + userId],
      // The max age for the cached data.
      '5m',
      // How long staleValue should be returned.
      '2h',
    )
    return response
  } catch (e) {
    // Return a stale value if available. The composable only returns
    // staleValue if it's still within the specificed max stale-if-error range.
    if (staleValue) {
      return staleValue
    }

    // Re-throw the error so it can be handled properly.
    throw e
  }
}
```

## Component Cache

The [`<RenderCacheable>` component](/features/component-cache#usage) will return
stale markup if an error happens during rendering of its **default slot**.

The _stale if error_ duration can be set via the `stale-if-error` prop on the
component:

```vue
<template>
  <div>
    <RenderCacheable max-age="5m" stale-if-error="2h">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

Or anywhere inside components that are rendered inside `<RenderCacheable>` using
the [useComponentCache](/composables/useComponentCache) composable:

```typescript
useComponentCache((helper) => {
  helper.setMaxAge('5m').setStaleIfError('2h')
})
```

## Route Cache

Use the `setStaleIfError` method on the _route cache helper_ provided by
[useRouteCache](/composables/useRouteCache):

```vue
<template>
  <div>
    This page is cached for 5 minutes or up to 2h when revalidation fails.
  </div>
</template>

<script lang="ts" setup>
useRouteCache((helper) => {
  helper.setMaxAge('5m').setStaleIfError('2h').setCacheable()
})
</script>
```

The stale route is only served for server errors: errors with a 5xx status code
and unhandled errors. A client error, such as a 404 thrown because the content
was deleted, is sent as usual.

## Only Use the Cache on Errors

To never serve an item from cache, but keep a stale copy for when an error
happens, set a max age of `0` together with a stale if error duration. This
works for all three caches.

```typescript
useRouteCache((helper) => {
  helper.setMaxAge(0).setStaleIfError('2h').setCacheable()
})
```

The stale copy is served to any request that fails, so this is not suited for
responses with data specific to the request. Mark those as uncacheable instead.
