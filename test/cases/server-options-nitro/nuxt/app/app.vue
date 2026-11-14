<template>
  <div>{{ data }}</div>
</template>

<script lang="ts" setup>
import {
  useAsyncData,
  useCacheAwareFetchInterceptor,
  useDataCache,
  useRouteCache,
} from '#imports'

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(3600)
})

const api = $fetch.create(useCacheAwareFetchInterceptor())

const { data } = await useAsyncData(async () => {
  const cache = await useDataCache<string>('greeting')
  if (cache.value) {
    return cache.value
  }

  const greeting = await api<string>('/api/greeting')
  await cache.addToCache(greeting)
  return greeting
})
</script>
