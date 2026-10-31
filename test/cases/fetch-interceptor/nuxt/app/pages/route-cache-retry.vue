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

// The first request fails and is retried by ofetch.
const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-flaky',
  interceptor,
)

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page'])
})
</script>
