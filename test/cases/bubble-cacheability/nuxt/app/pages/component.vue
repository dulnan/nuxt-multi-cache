<template>
  <div>
    <RenderCacheable bubble-cacheability>
      <CaseComponent />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { useCDNHeaders, useRouteCache } from '#imports'

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
