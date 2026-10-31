<template>
  <div>
    <div>{{ data?.value }}</div>
  </div>
</template>

<script setup lang="ts">
import {
  useCDNHeaders,
  useRouteCache,
  useAsyncData,
  useDataCache,
} from '#imports'

// Set before the data cache item bubbles its cacheability.
useRouteCache((route) => {
  route.setCacheable().setMaxAge(9000).setStaleIfError(18000)
})

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 9000).setNumeric('staleIfError', 18000)
})

const { data } = await useAsyncData(async () => {
  const { value, addToCache } = await useDataCache<{ value: string }>(
    'permanent',
    null,
    { bubbleCacheability: true },
  )

  if (value) {
    return value
  }

  const result = { value: 'Hello World' }

  // Without a max age and stale-if-error.
  await addToCache(result)
  return result
})
</script>
