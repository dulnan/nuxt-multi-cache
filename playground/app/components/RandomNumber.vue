<template>
  <div>
    <h3>Component with random number</h3>
    <div id="data-cache-value">{{ random }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from '#imports'

const random = computed(() => {
  return 'RANDOM_NUMBER__' + Math.round(Math.random() * 1000000000) + '__'
})
</script>
