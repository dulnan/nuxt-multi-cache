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

useRouteCache((route) => {
  route.setCacheable().addTags(['tag-from-route']).setMaxAge(9000)
})

useCDNHeaders((cdn) => {
  cdn.addTags(['tag-from-route']).setNumeric('maxAge', 9000)
})

const { data } = await useAsyncData(() => {
  // The data cache neither reads nor stores keys with "?", e.g. from a query
  // value.
  return useDataCacheCallback(
    'skipped?city=bern',
    (helper) => {
      helper?.addTags(['tag-from-skipped']).setMaxAge(100)
      return {
        value: 'Not cached',
      }
    },
    null,
    {
      bubbleCacheability: true,
    },
  )
})
</script>
