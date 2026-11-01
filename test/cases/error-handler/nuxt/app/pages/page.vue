<template>
  <div id="id">{{ id }}</div>
</template>

<script setup lang="ts">
import { setCookie, setResponseHeader } from 'h3'
import { createError, useRequestEvent, useRoute, useRouteCache } from '#imports'

/**
 * A page cached with stale-if-error. "?fail=true" sets a cookie and a header,
 * then makes rendering fail. The query is not part of the cache key.
 */
useRouteCache((route) => {
  route.setCacheable().setMaxAge(60).setStaleIfError(3600)
})

if (useRoute().query.fail) {
  const event = useRequestEvent()
  if (event) {
    setCookie(event, 'failed-request', 'true')
    setResponseHeader(event, 'x-failed-request', 'true')
  }
  throw createError({ statusCode: 500, fatal: true })
}

// Unique, because requests can take less than a millisecond.
const id = crypto.randomUUID()
</script>
