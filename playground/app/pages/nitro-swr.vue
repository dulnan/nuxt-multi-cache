<template>
  <div>CDN Headers</div>
</template>

<script setup lang="ts">
const event = useRequestEvent()

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', Math.round(Math.random() * 100000))
}, event)
</script>
