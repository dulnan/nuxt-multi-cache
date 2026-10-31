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

::: warning

`<Teleport>` can't be used inside `<RenderCacheable>`. Teleported content is
rendered outside of the component's markup, so it is not part of the cached
markup.

:::

The cacheability of a component can also be set dynamically using the
[useComponentCache](/composables/useComponentCache) composable.

## Requirements

- The slot may only contain a single component
- You can only cache a component, not any other type of templates
- If you need to render a component conditionally, put the `v-if` on
  `<RenderCacheable>`, **not** the component to be cached
- **Do not** alter global state from within cached components, as the code is
  only [executed once](#caveats)

## Configuration

::: code-group

```typescript [nuxt.config.ts]
export default defineNuxtConfig({
  multiCache: {
    component: {
      // If true the cache is enabled.
      // If false the cache is disabled, but the component is still added to
      // the build.
      enabled: true,
    },
  },
})
```

```typescript [server/multiCache.serverOptions.ts]
import { defineMultiCacheOptions } from 'nuxt-multi-cache/server-options'
import myCustomDriver from './somehwere'

export default defineMultiCacheOptions(() => {
  return {
    component: {
      storage: {
        driver: myCustomDriver(),
      },
    },
  }
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
This means the following features should _generally_ not be used in a cached
component (list not exhaustive):

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
Navbar::Ylz5VOwkRMOWmgMvYyM3Z8ezbzYJEPHc_d-2Jcf5oTk
```

This means that for each possible language a different cache key is generated.

### Slot Content

Only the props are part of the generated key, not the content the component
receives in its slots. This content is rendered by the parent and can be
different for every request. A component with slot content is therefore only
cached if a `cache-key` is provided:

```vue
<template>
  <div>
    <!-- Not cached: The generated key doesn't include the slot content. -->
    <RenderCacheable>
      <Card variant="info">{{ $t('welcome') }}</Card>
    </RenderCacheable>

    <!-- Cached per language. -->
    <RenderCacheable :cache-key="'info--' + locale">
      <Card variant="info">{{ $t('welcome') }}</Card>
    </RenderCacheable>
  </div>
</template>
```

A custom key replaces the generated one, so it must also cover the props. If the
slot content and the props are the same for every instance, an empty `cache-key`
uses one entry for all instances.

### Custom Cache Key

You can also provide your own cache key:

```vue
<template>
  <div>
    <RenderCacheable :cache-key="[currentLanguage, currentCurrency].join('--')">
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

The resulting keys of the cache entries will be something like:

- `Navbar::en--usd`
- `Navbar::de--chf`
- `Navbar::fr--eur`

The storage normalizes the key, and a key with a `?` is not cached at all (see
[Cache Keys](/advanced/cache-backend#cache-keys)).

### Wrapper Components

`<RenderCacheable>` can also be used in a wrapper component that forwards its
own slot:

```vue
<template>
  <RenderCacheable :cache-key="cacheKey">
    <slot />
  </RenderCacheable>
</template>
```

In this case, a cache key is required: Without one, the content is not cached.
The wrapper can't know what is passed into its slot, so a key derived from props
could be the same for different content. The key is built from the name of the
first component in the forwarded slot and the cache key, e.g. `Navbar::en--usd`.

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
  -H "x-nuxt-multi-cache-token: hunter2" \
  --data '["navbar"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

The components are removed after a delay. See
[Purge Tags](/features/api#purge-tags).

## Max Age

You can cache components only for a limited amount of time by defining a
[max age](/overview/max-age), either in seconds or as a named value like `'1h'`:

```vue
<template>
  <div>
    <RenderCacheable :max-age="3600">
      <Navbar :language="language" :currency="currency" />
    </RenderCacheable>
  </div>
</template>
```

Here the component will be rendered again once 1 hour passes. Expired cache
entries are overwritten the next time they're rendered. Whether they're removed
from the storage before that depends on the cache driver; see
[Expiration](/advanced/cache-backend#expiration).

## Bubbling Cacheability

By default, the max age and cache tags of a cached component don't affect the
route cache or the CDN headers of the page that renders it. To merge them, set
the `bubble-cacheability` prop:

```vue
<template>
  <div>
    <RenderCacheable max-age="1h" :cache-tags="['navbar']" bubble-cacheability>
      <Navbar />
    </RenderCacheable>
  </div>
</template>
```

See [Bubbling Cacheability](/overview/bubble-cacheability) for details.

## Nesting

A `<RenderCacheable>` can contain other `<RenderCacheable>` instances, for
example in a child component. The cached markup of the outer instance contains
the markup of the inner ones, so their cacheability is always merged into the
outer instance, independent of the `bubble-cacheability` prop:

- If an inner instance has `no-cache` or is marked as uncacheable, the outer
  instance isn't cached either.
- The lowest max age and stale if error duration win, and the cache tags of the
  inner instances are added. This also applies when an inner instance is
  returned from cache.

An inner instance that is rendered without cache because no cache key could be
generated doesn't affect the outer instance.

The merging happens when the outer instance is rendered. When the outer instance
is returned from cache, the inner instances aren't rendered at all. The outer
instance must therefore still vary its cache key, or set `no-cache`, for
everything its content depends on.

Data cache items in the slot only
[bubble](/overview/bubble-cacheability#data-cache) to the route cache and the
CDN headers, not to the enclosing `<RenderCacheable>`.

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
Setting `:no-cache="true"` makes sure that the component is not fetched from the
cache and also is not put into the cache. An enclosing `<RenderCacheable>` isn't
cached either, see [Nesting](#nesting).

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

### `cacheKey (string, default: undefined)`

The key to use for the cache entry. If not provided, a key is automatically
generated based on the props passed to the child. The key is automatically
prefixed by the component name. If the child receives
[slot content](#slot-content), a key is required.

An empty string disables the generated key: All instances of the component then
share the same cache entry.

### `cacheTags (string | string[], default: [])`

Cache tags that can be later used for invalidation.

### `maxAge (MaxAge, default: undefined)`

The [max age](/overview/max-age) of the cache entry. If not provided, the entry
is cached permanently.

### `staleIfError (MaxAge, default: undefined)`

How long the cached markup can be returned if an error happens during rendering.
See [Stale if Error](/overview/stale-if-error#component-cache).

### `asyncDataKeys (string | string[], default: [])`

Provide the async data keys used by the cached component. If provided, the
payload data will be cached alongside the component. If the component uses
asyncData and the keys are not provided, you will receive a hydration mismatch
error in the client.

### `bubbleCacheability (boolean | 'route' | 'cdn', default: false)`

Merge the cacheability of the component into the route cache and/or the CDN
headers. See [Bubbling Cacheability](/overview/bubble-cacheability).

## Caveats

Keep in mind that the code of components wrapped in `<RenderCacheable>` is only
executed once - afterwards only its cached markup is used.

This means that you must avoid relying on global state in your components,
unless you vary the cache key accordingly. You must also not define or alter
global state from within the component in any way, as this will cause unexpected
behaviour.

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
