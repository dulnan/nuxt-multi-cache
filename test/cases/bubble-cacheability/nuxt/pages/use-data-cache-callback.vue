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
    'use-data-cache-callback',
    (helper) => {
      if (helper) {
        helper
          .addTags(['tag-from-callback'])
          .setMaxAge(100)
          .setStaleIfError('1d')
      }
      return {
        value: 'Cached value',
      }
    },
    null,
    {
      bubbleCacheability: true,
    },
  )
})

useRouteCache((route) => {
  route.addTags(['tag-from-route']).setMaxAge(9000).setStaleIfError(18000)
})

useCDNHeaders((cdn) => {
  cdn
    .addTags(['tag-from-route'])
    .setNumeric('maxAge', '2h')
    .setNumeric('staleIfError', 18000)
})
</script>
