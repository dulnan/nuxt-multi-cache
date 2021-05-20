---
title: Components
description: Cache fully rendered components.
position: 110
category: 'Caches'
---

<p className="lead">
A component cache is useful if you have complex components that appear on
multiple or all pages. Typically this includes navigations, footer, teasers or
other components in your default.vue layout.
</p>

Even if a component just appears on a single page, you may still want to cache
it, in particular if its very complex. That way you can disable caching for a
page, while still preventing the rendering of this component on every request.

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
of vue-server-renderer. Have a look at the documentation to understand how
component caching works.

<alert type="warning">

A cached component should only rely on data passed in via props, so **no external
state**, as this will result in unexpected behavior.

</alert>

This module adds support for cache tags using a custom cache backend that
extracts the tags from the string returned in `serverCacheKey` and provides a
way to purge components based on the key or the tag.

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
created: 

- `ProductTeaser::442_highlighted`
- `ProductTeaser::131_default`
- `ProductTeaser::442_default`

You need to make sure that the key is _really_ unique for the exact resulting
markup of a component.

## Using cache tags

Because this module uses the existing `serverCacheKey` method, the cache tags
have to be part of the key. Note that the tags themselves **are not** part of
the final key used to identify a cache entry! This is just a workaround (or you
could call it a hack), so that we're able to use the existing caching
implementation of vue-server-renderer.

You can import the `getServerCacheKey` method to build the key including the
cache tags.

**components/Footer.vue**
```vue
<template>
  <div class="footer">
    <!-- a lot of markup -->
  </div>
</template>

<script>
import { getServerCacheKey } from 'nuxt-multi-cache/client'
export default {
  name: 'Footer',

  serverCacheKey(props) {
    return getServerCacheKey('default', ['link:123', 'article:342', 'article:569'])
  }
}
</script>
```

The output of this method will be:

`default____link:123$article:342$article:569`

The cache tags are appended after four underscores `____`, separated using a
single dollar sign `$`.

The component cache backend will split the string up before saving it to the
cache. The actual component key will be `Footer::default` and the tags are
`["link:123", "article:342", "article:569"]`
