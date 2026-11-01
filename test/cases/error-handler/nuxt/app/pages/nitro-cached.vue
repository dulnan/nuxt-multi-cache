<template>
  <div id="id">{{ id }}</div>
</template>

<script setup lang="ts">
import { createError, useRouteCache } from '#imports'

/**
 * A page cached with stale-if-error, which is also cached by Nitro (route
 * rules with `swr`). Rendering fails while the backend is down (see
 * server/routes/backend.post.ts) instead of with a query: Nitro's cache key
 * includes the query.
 */
useRouteCache((route) => {
  route.setCacheable().setMaxAge(60).setStaleIfError(3600)
})

if (import.meta.server && (globalThis as any).__testBackendDown) {
  throw createError({ statusCode: 500, fatal: true })
}

// Unique, because requests can take less than a millisecond.
const id = crypto.randomUUID()
</script>
