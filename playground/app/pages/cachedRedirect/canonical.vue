<template>
  <div>The canonical URL</div>
</template>

<script lang="ts" setup>
import { navigateTo, useRoute, useRouteCache } from '#imports'

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})

// Redirects to the URL without the query and the trailing slash, which has the
// same route cache key.
const canonical = '/cachedRedirect/canonical'
if (useRoute().fullPath !== canonical) {
  await navigateTo(canonical, { redirectCode: 301 })
}
</script>
