<template>
  <main>
    <h1>Error: {{ code }}</h1>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error?: NuxtError
}>()

// see all error properties in the console
console.error('error', props.error)

const code = computed(() => props.error?.statusCode || 500)

useCDNHeaders((cdn) => {
  if (code.value === 404) {
    cdn.setNumeric('maxAge', 60).public()
  } else {
    cdn.private()
  }

  cdn.addTags(['error:' + code.value])
})
</script>
