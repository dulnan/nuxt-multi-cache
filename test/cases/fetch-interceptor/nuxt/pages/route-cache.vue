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

const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-route',
  interceptor,
)

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page'])
})
</script>
