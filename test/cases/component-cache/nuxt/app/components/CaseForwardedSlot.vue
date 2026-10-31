<template>
  <RenderCacheable :cache-key="cacheKey">
    <slot />
  </RenderCacheable>
</template>

<script setup lang="ts">
defineProps<{
  cacheKey?: string
}>()
</script>
