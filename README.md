# nuxt-multi-cache

SSR page, component and data cache for Nuxt 2. Supports purging cache entries by key or by cache tags.

**[Installation](https://nuxt-multi-cache.netlify.app/guide/setup)** - **[Documentation](https://nuxt-multi-cache.netlify.app)** - **[NPM](https://www.npmjs.com/package/nuxt-multi-cache)**

**Version 1.x of this module is only compatible with Nuxt 2.**
**Use > 2.x for Nuxt 3 compatibility.**

# Concepts
- **Cache:** Page, component and data with support for cache tags
- **Purge:** Using cache tags or by key
- **Pick:** Enable only what you need
- **Manage:** REST API for purging and getting stats about the caches

# Example

## Cache a page with cache tags
```vue
<template>
  <div>
    <h1>Welcome!</h1>
  </div>
</template>

<script>
export default {
  asyncData({ app }) {
    return app.$api.get('article', { id: 10 }).then(article => {
      app.$cache.route.setCacheable()
      app.$cache.route.addTags(['article:10'])
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

## Purge a cached page

```bash
curl -X POST -i \
  -H "Authorization: Basic YWRtaW46aHVudGVyMgo=" \
  -H "Content-Type: application/json" \
  --data '["article:10"]' \
  http://localhost:3000/__nuxt_multi_cache/purge/tags
```

# Warning
Caching is hard. You should be aware of the risks and potentially huge security
issues that may arise when caching an entire page.

Always make sure to never cache anything with content restricted to
authenticated users. Else you may leak sensitive information to anonymous
users.
