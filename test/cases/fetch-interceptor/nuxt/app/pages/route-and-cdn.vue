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
  useCDNHeaders,
} from '#imports'

const interceptor = useCacheAwareFetchInterceptor()

const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-cdn-and-route',
  interceptor,
)

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page']).setNumeric('maxAge', '1h')
})

useCDNHeaders((cdn) => {
  cdn.addTags('cdn-tag-from-page').setNumeric('maxAge', '1h')
})
</script>
