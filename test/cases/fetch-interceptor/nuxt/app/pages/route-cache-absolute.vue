<template>
  <div>
    <div id="current-time">{{ data?.timestamp }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCacheAwareFetchInterceptor,
  useFetch,
  useRequestURL,
  useRouteCache,
} from '#imports'

const interceptor = useCacheAwareFetchInterceptor()
const origin = useRequestURL().origin

// Absolute URLs leave the app, like requests to other servers.
const { data } = await useFetch<{ timestamp: number }>(
  '/api/handler-with-route',
  { ...interceptor, baseURL: origin },
)
await useFetch(`${origin}/api/handler-injecting`, interceptor)

useRouteCache((helper) => {
  helper.setCacheable().addTags(['tag-from-page'])
})
</script>
