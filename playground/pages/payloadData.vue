<template>
  <div>
    <RenderCacheableComponent
      cache-key="test_18539"
      :async-data-keys="['withAsyncData']"
    >
      <WithAsyncData />
    </RenderCacheableComponent>
  </div>
</template>

<script setup lang="ts">
import RenderCacheableComponent from '../../src/runtime/components/RenderCacheable'
</script>
