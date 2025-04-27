<template>
  <div>CDN Headers</div>
</template>

<script setup lang="ts">
import { useCDNHeaders, useRequestEvent } from '#imports'

const event = useRequestEvent()

useCDNHeaders((cdn) => {
  cdn.setNumeric('maxAge', 900)
}, event)
</script>
