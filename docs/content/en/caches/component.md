---
title: Components
position: 4
category: 'Caches'
---

A component cache is useful if you have complex components that appear on
multiple or all pages. Typically this includes navigations, footer, teasers or
other components in your `default.vue` layout.

## Config

Enable the component cache module:

```javascript
module.exports = {
  multiCache: {
    componentCache: {
      enabled: true
    },
  }
}
```

## How it works

nuxt-multi-cache uses the built-in [component cache
implementation](https://ssr.vuejs.org/guide/caching.html#component-level-caching)
of vue-server-renderer.

It adds support for cache tags using a custom cache backend that extracts the
tags from the string returned in `serverCacheKey`.

## Caching a component

By default, no components are cached. To enable caching you have to return a
unique key in the `serverCacheKey` method of your component:

```javascript
export default {
  name: 'MyComponent',

  serverCacheKey() {
    return 'default'
  }
}
```

Your rendered component will now be cached using `MyComponent::default` as the
unique key.

## Component cache key

vue-server-renderer passes in the props of your component as an argument to the
`serverCacheKey` method. You can use this to create multiple cached variations
of your component.

**components/ProductTeaser.vue**
```vue
<template>
  <div class="product-teaser" :class="{ 'is-highlighted': isHighlighted }">
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
export default {
  name: 'ProductTeaser',

  props: {
    productId: String,
    isHighlighted: Boolean,
    title: String,
  },

  serverCacheKey(props) {
    const variant = props.isHighlighted ? 'highlighted' : 'default'
    return `${props.productId}_${variant}`
  }
}
</script>
```

**components/ProductList.vue**
```vue
<template>
  <div>
    <product-teaser product-id="442" title="Foo" :is-highlighted="true" />
    <product-teaser product-id="131" title="Bar" />
    <product-teaser product-id="442" title="Foo" />
  </div>
</template>
```

Now, before the renderer is rendering the component, it will first pass in the
props to the `serverCacheKey` method to receive the unique key. If such a key
exists in the cache, the previously rendered component is used instead.

It's important that the component's cache key is unique, based on the provided
props. In the example above, three different component cache entries will be
created.

## Using cache tags

Because this module uses the existing `serverCacheKey` method, the cache tags
have to be part of the key. Note that the tags themselves **are not** part of
the final key used to identify a cache entry! This is just a workaround (or you
could call it a hack) so we're able to use the existing caching implementation
of vue-server-renderer.

**components/Footer.vue**
```vue
<template>
  <div class="footer">
    <!-- a lot of markup -->
  </div>
</template>

<script>
export default {
  name: 'Footer',

  serverCacheKey(props) {
    return 'default____link:123$article:342$article:569'
  }
}
</script>
```

The cache tags are appended after four underscores `____`, separated using a
single dollar sign `$`.

The actual component key would be `Footer::default`.

Now that's not really a nice way to set the key, so there is a helper method
available that builds the key for you:

**components/Footer.vue**
```vue
<template>
  <div class="footer">
    <!-- a lot of markup -->
  </div>
</template>

<script>
import { getServerCacheKey } from 'nuxt-multi-cache'
export default {
  name: 'Footer',

  serverCacheKey(props) {
    return getServerCacheKey('default', ['link:123', 'article:342', 'article:569'])
  }
}
</script>
```

