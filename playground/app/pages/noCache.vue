<template>
  <div>
    <RenderCacheable cache-key="one" :cache-tags="['tag1']" :no-cache="true">
      <QueryValue />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { RenderCacheable } from '#components'
</script>
