# useComponentCache

Only available in **Nuxt**.

This composable is available if the [Component Cache](/features/component-cache)
is enabled.

Set cacheability of components rendered inside `<RenderCacheable>`. The
cacheability is merged with the one set on `<RenderCacheable>`, e.g. it's
possible to set a lower max age from within the component or make the component
uncacheable.

The composable can also be used in nested components, as long as they have
`<RenderCacheable>` as a parent somewhere.

```typescript
useComponentCache((helper) => {
  helper.setMaxAge(900).addPayloadKeys(['users'])
})
```

## Full example

```vue
<script lang="ts" setup>
const { data } = await useAsyncData('users', () => {
  return $fetch('/api/get-users')
})

useComponentCache((helper) => {
  helper.setMaxAge(900).addPayloadKeys(['users']).addTags(data.value.cacheTags)
})
</script>
```

## Methods

### setMaxAge(maxAge: MaxAge)

Set the [max age](/overview/max-age) for the cached component. The max age is
only set if it's lower than the current value.

### setStaleIfError(maxAge: MaxAge)

Set how long the cached markup can be returned if an error happens during
rendering. See [Stale if Error](/overview/stale-if-error#component-cache).

### addTags(tags: string|string[])

Add one or more cache tags.

### setCacheable()

Make the component cacheable. Note that by default the component is always
cacheable for backwards-compatibility, so calling this method has basically no
effect.

### setUncacheable()

Make the component uncacheable. Once this method is called it can not be
reverted and the component will be uncacheable. An enclosing `<RenderCacheable>`
becomes uncacheable as well, see [Nesting](/features/component-cache#nesting).

### addPayloadKeys(keys: string|string[])

Add one or more payload keys whose values should be cached alongside the
component markup.

This is the key defined in `useAsyncData()` or `useFetch()`. Only the data in
`nuxtApp.payload.data` is cached, not state from `useState()`.

If used, the `<RenderCacheable>` component will also cache the payload value
together with the component. On subsequent requests, when returning a cached
component, the cached payload will also be added to the SSR response.
