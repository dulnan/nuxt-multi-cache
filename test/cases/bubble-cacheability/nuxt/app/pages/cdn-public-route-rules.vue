<template>
  <div>CDN public</div>
</template>

<script setup lang="ts">
import { useCDNHeaders } from '#imports'

useCDNHeaders((cdn) => {
  cdn.public().setNumeric('maxAge', 3600)
})
</script>
