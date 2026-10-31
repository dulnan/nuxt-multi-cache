<template>
  <div>
    <div>{{ data?.value }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCDNHeaders,
  useRouteCache,
  useDataCacheCallback,
  useAsyncData,
} from '#imports'

const { data } = await useAsyncData(() => {
  return useDataCacheCallback(
    'use-data-cache-callback-uncacheable',
    (helper) => {
      helper?.setUncacheable()
      return {
        value: 'Uncacheable value',
      }
    },
    null,
    {
      bubbleCacheability: true,
    },
  )
})

useRouteCache((route) => {
  route.setCacheable().setMaxAge(9000)
})

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 9000)
})
</script>
