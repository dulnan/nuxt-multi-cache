<template>
  <div>
    <RenderCacheable
      cache-key="test_18539"
      :async-data-keys="['withAsyncData']"
    >
      <WithAsyncData />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { RenderCacheable } from '#components'
</script>
