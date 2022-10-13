---
title: Basic usage
description: Getting started using the module.
position: 2
category: 'Getting started'
---

<p className="lead">
By default nothing is cached, even if you enable a cache. This means that you
have to set cache entries yourself. A helper plugin is provided in the global
context as `$cache`.
</p>

### Caching a page

Calling `$cache.route.setCacheable()` will mark the current page as cacheable.
You can call this method anywhere (page, layout, components, nuxtServerInit,
middleware, etc), as long as the code is called during server-side rendering.

#### pages/article.vue
```vue
<template>
  <div>
    <h1>Welcome!</h1>
  </div>
</template>

<script>
export default {
  asyncData({ app }) {
    return app.$api.get('article').then(article => {
      app.$cache.route.setCacheable()
      return { article }
    })
  },

  data() {
    return {
      article: {}
    }
  }
}
</script>
```

During the first request, Nuxt will render the entire page and then the module
will cache the resulting markup. A second request for this exact same path will
then be served the cached markup.

### Adding cache tags

So far it's a simple route cache. The really useful part though are cache tags.

In a nutshell, you can assign any cache tags you want to a cached route. A
cache tag should uniquely identify one or more parts of a page.

For example, if you have a route to view an article with an image, you may want
to add cache tags for the article ID and the image ID:

```javascript
app.$cache.route.setCacheable()
app.$cache.route.addTags(['article:5', 'image:14'])
```

Now this page is associated with two tags. Whenever the article or image
changes, you can purge all pages that use this tag:

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["article:5"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

All pages with this tag will be immediately removed from the cache.
