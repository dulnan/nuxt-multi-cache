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

// The API route doesn't use the route cache, so its response has no route
// cache tags header.
const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-cdn',
  interceptor,
)

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page'])
})
</script>
