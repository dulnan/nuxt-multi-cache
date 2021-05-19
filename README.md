# Nuxt Route Cache

Caches pages based on the route and purge a cached page.

# Concepts
- **Cache:** Page, component and data
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
      app.$cache.page.setCacheable()
      app.$cache.page.addTags(['article:10'])
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
