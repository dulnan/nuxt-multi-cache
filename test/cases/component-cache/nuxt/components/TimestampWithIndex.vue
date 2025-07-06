<template>
  <div>
    <div id="timestamp">{{ Date.now() / 1000 }}</div>
    <div id="index">{{ index }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  index: number | string
}>()
</script>
