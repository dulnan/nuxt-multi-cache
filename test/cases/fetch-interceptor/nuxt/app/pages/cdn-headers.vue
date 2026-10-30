<template>
  <div>
    <div id="current-time">{{ data?.timestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCacheAwareFetchInterceptor,
  useFetch,
  useCDNHeaders,
} from '#imports'

const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-cdn',
  interceptor,
)

useCDNHeaders((cdn) => {
  cdn.addTags(['cdn-cache-tag-from-page']).setNumeric('maxAge', '7d')
})
</script>
