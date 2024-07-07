# "Stale if error" route caching

Maybe you want to cache routes, but only serve them from cache if the route
throws an error.

A common example is integrating an external API that might regularly be down. In
such a case it might be okay to keep serving a stale response until the API is
back up again.

In this example, the Nuxt page is cached for one minute, so the data is always a
maximum of one minute stale. However, should the API be down, you can continue
to serve stale content for up to 3600 seconds (1 hour).

```vue
<script lang="ts" setup>
const { data } = await useFetch('https://api.example.com/constantly-down')

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(60).setStaleIfError(3600)
})
</script>
```
