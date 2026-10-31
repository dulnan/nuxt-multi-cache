<template>
  <div>CDN private</div>
</template>

<script setup lang="ts">
import { useCDNHeaders, useRouteCache } from '#imports'

useRouteCache((route) => {
  route.setCacheable()
})

useCDNHeaders((cdn) => {
  cdn.public().setNumeric('maxAge', 3600).private()
})
</script>
