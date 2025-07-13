<template>
  <div>
    <div>{{ data?.value }}</div>
  </div>
</template>

<script setup lang="ts">
import { useCDNHeaders, useRouteCache, useAsyncData } from '#imports'
import { useData } from '../composables/useData'

const { data } = await useAsyncData(() => {
  return useData()
})

useRouteCache((route) => {
  route.addTags(['tag-from-route']).setMaxAge(9000).setStaleIfError(18000)
})

useCDNHeaders((cdn) => {
  cdn
    .addTags(['tag-from-route'])
    .setNumeric('maxAge', 9000)
    .setNumeric('staleIfError', 18000)
})
</script>
