<template>
  <div>
    <div id="current-time">{{ data?.timestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCacheAwareFetchInterceptor,
  useFetch,
  useRouteCache,
} from '#imports'

const interceptor = useCacheAwareFetchInterceptor()

// The API route has a lower max age and stale-if-error than the page.
const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-route-max-age',
  interceptor,
)

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(3600).setStaleIfError(7200)
})
</script>
