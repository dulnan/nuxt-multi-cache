<template>
  <div id="counter">
    <p>Count: <span id="count">{{ count }}</span></p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>
