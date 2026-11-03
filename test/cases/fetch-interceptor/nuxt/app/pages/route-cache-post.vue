<template>
  <div>
    <div id="current-time">{{ data?.timestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCacheAwareFetchInterceptor,
  useFetch,
  useRoute,
  useRouteCache,
} from '#imports'

const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch<{ timestamp: number }>('/api/handler-post', {
  method: 'POST',
  query: { uncacheable: useRoute().query.uncacheable },
  ...interceptor,
})

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page'])
})
</script>
