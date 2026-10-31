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
  '/api/handler-with-cdn-shared-max-age',
  interceptor,
)

// Set after the fetch: The page must not be cached.
useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 0)
})
</script>
