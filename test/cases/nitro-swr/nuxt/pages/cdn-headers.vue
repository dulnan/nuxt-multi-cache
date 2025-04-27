<template>
  <div>CDN Headers</div>
</template>

<script setup lang="ts">
const event = useRequestEvent()

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 900)
}, event)
</script>
