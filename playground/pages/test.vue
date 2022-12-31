<template>
  <div>
    <RenderCacheableComponent cache-key="one" :cache-tags="['tag1']">
      <QueryValue />
    </RenderCacheableComponent>
  </div>
</template>

<script setup lang="ts">
import RenderCacheableComponent from '../../src/runtime/components/RenderCacheable'
</script>
