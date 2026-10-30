<template>
  <div>
    <RenderCacheable bubble-cacheability>
      <CaseUncacheableComponent />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { useCDNHeaders, useRouteCache } from '#imports'

useRouteCache((route) => {
  route.setCacheable().setMaxAge(9000)
})

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 9000)
})
</script>
