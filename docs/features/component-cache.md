# Component Cache

- Caches the rendered markup of components
- Works in SSR (server-side rendering) and SSG (static site generation)
- Supports caching payloads for component
- Minimal impact on client bundle size
- Component must have a name in order to be cacheable

The RenderCacheable component is a wrapper for cacheable Vue components. It
allows you to cache the contents of the default slot based on the props of the
first child in the slot. Alternatively, you can provide a custom cache key.

On the server, the contents of the default slot will be cached as markup. After
that, rendering is skipped and the markup is directly rendered.

Note that the slot can only have a single child. If you need to include multiple
children, you have to create a separate component for that.

::: warning

Due to a [bug in Vue](https://github.com/vuejs/core/issues/6207) it's currently
not possible to use `<Teleport>` together with `<RenderCacheable>` (or any other
async component).

:::

## Configuration

::: code-group

```typescript [nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  multiCache: {
    component: {
      // If true the cache is enabled.
      // If false the cache is disabled, but the component is still added to
      // the build.
      enabled: true,
    }
  }
}
```

```typescript [multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/dist/runtime/serverOptions'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions({
  component: {
    storage: {
      driver: myCustomDriver(),
    },
  },
})
```

:::

## Usage

```vue
<template>
  <div>
    <RenderCacheable>
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

The contents of the default slot are rendered only once and the resulting markup
is cached. Each subsequent request will directly return the cached markup and
skip rendering.

## Cache Key

Because the component is only rendered once it can't rely on external state.
This means the following features should not be used in a cached component (list
not exhaustive):

- Global state (useState)
- Pinia (useStore)
- Router (useRoute)
- Meta (useHead)
- Request (useRequestHeaders, useRequestEvent, useCookie)

You can however use any of these in the parent component and pass values via
props.

For example, if you use internationalization your component will render
differently based on the current language. This means the cache key must take
this into account:

```vue
<template>
  <div>
    <RenderCacheable>
      <Navbar :language="currentLanguage" />
    </RenderCacheable>
  </div>
</template>
```

The cache key is automatically derived from the component's name and props. The
props are hashed and appended to the component name:

```
Navbar::voBC1hkg5S
```

This means that for each possible language a different cache key is generated.

### Custom Cache Key

You can also provide your own cache key:

```vue
<template>
  <div>
    <RenderCacheable :cache-key="[currentLanguage, currentCurrenсy].join('--')">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

The resulting keys of the cache entries will be something like:

- `Navbar::en--usd`
- `Navbar::de--chf`
- `Navbar::fr--eur`

## Cache Tags

You can provide custom cache tags that can later be used to remove components
from the cache:

```vue
<template>
  <div>
    <RenderCacheable :cache-tags="['navbar']">
      <Navbar :language="language" :currency="currency" />
    </RenderCacheable>
  </div>
</template>
```

Assuming there are a lot of language and currency combinations you will end up
with dozens of cache entries for this component. But because each share the same
cache tag (`navbar`) you can remove all of them from the cache at once by
purging by cache tag:

```bash
curl -X POST -i \
  -H "Content-Type: application/json" \
  --data '["navbar"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

## Max Age

You can cache components only for a limited amount of time by defining a max age
in seconds:

```vue
<template>
  <div>
    <RenderCacheable :max-age="3600">
      <Navbar :language="language" :currency="currency" />
    </RenderCacheable>
  </div>
</template>
```

Here the component will be rendered again once 1 hour passes. Note that cache
entries are not automatically removed when they expire. They will be overwritten
the next time they're rendered.

## Payload Extraction

If the cached component fetches data using useAsyncData or useFetch you have to
tell `<RenderCacheable>` which payload keys to extract.

Assume you have the following Weather component:

```vue
<template>
  <div>
    <!-- Render Weather -->
  </div>
</template>

<script lang="ts" setup>
const { data: weather } = await useAsyncData('weather', () => {
  return $fetch('/api/getWeather')
})
</script>
```

We use the `weather` key in `useAsyncData`. So we have to provide the same key:

```vue
<template>
  <div>
    <RenderCacheable :async-data-keys="['weather']">
      <Weather />
    </RenderCacheable>
  </div>
</template>
```

Now after the initial rendering the corresponding payload with the `weather` key
is extracted and cached alongside the component. Each subsequent request will
now return the cached markup _and_ add the payload to the response.

## Skipping Caching

Using the `noCache` prop you can skip caching for a component. An example would
be if our Navbar component shows sensitive information, like email of the user.
Setting `:no-cache="false"` makes sure that the component is not fetched from
the cache and also is not put into the cache.

## All Props

```vue
<template>
  <div>
    <RenderCacheable
      tag="aside"
      :async-data-keys="['weatherData']"
      :cache-tags="['weather', 'global']"
      :cache-key="language"
      :no-cache="userIsLoggedIn"
    >
      <Weather />
    </RenderCacheable>
  </div>
</template>
```

### `tag (string, default: 'div')`

The tag to use for the wrapper. It's unfortunately not possible to implement
this without a wrapper.

### `noCache (boolean, default: false)`

Disable caching entirely for this component.

### `cacheKey (string, default: '')`

The key to use for the cache entry. If left empty, a key is automatically
generated based on the props passed to the child. The key is automatically
prefixed by the component name.

### `cacheTags (string[], default: [])`

Cache tags that can be later used for invalidation.

### `asyncDataKeys (string[], default: [])`

Provide the async data keys used by the cached component. If provided, the
payload data will be cached alongside the component. If the component uses
asyncData and the keys are not provided, you will receive a hydration mismatch
error in the client.

## Behind the Scenes

In Vue 2 / Nuxt 2 component caching was integrated in vue-server-renderer using
the `serverCacheKey` method on components. This feature was removed with the V3
releases, so an alternative solution had to be found.

The `<RenderCacheable>` component uses the `ssrRenderSlotInner` method from
`vue/server-renderer` to get the rendered markup and stores it in the cache.
This markup is then returned as a render function:

```typescript
return () => h('div', { innerHTML: cachedMarkup })
```

This works reasonably well. On the client the component is rendered normally.
This approach has the same limitations as before: Cached components can't get or
set any global state and they must render the same way for the given props.
