# "Stale if error" route caching

Cache a page for a short time, and keep serving the last working version of it
while an API it depends on is down.

A common example is integrating an external API that might regularly be down. In
such a case it might be okay to keep serving a stale response until the API is
back up again.

In this example, the Nuxt page is cached for one minute, so the data is always a
maximum of one minute stale. However, should the API be down, you can continue
to serve stale content for up to 3600 seconds (1 hour).

```vue
<script lang="ts" setup>
const { data, error } = await useFetch(
  'https://api.example.com/constantly-down',
)

// useFetch doesn't throw if the request fails. Throw an error, so that the
// stale page is served instead of a page without data.
if (error.value) {
  throw createError({ statusCode: 502, statusMessage: 'API not available' })
}

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(60).setStaleIfError(3600)
})
</script>
```

The stale page is only served if an error is thrown while the page is rendered.
Without the error, the page would be rendered without data, and this response
would be cached instead.

If you never want to serve the page from cache, unless the API is down, set the
max age to `0`. See
[Only Use the Cache on Errors](/overview/stale-if-error#only-use-the-cache-on-errors).
