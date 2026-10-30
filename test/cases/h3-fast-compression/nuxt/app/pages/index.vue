<template>
  <div>
    <div id="current-time">The current time: {{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useRouteCache } from '#imports'

const { data } = await useAsyncData(() => {
  return Promise.resolve(Date.now().toString())
})

useRouteCache((cache) => {
  cache.setCacheable().setNumeric('maxAge', 6000)
})
</script>
