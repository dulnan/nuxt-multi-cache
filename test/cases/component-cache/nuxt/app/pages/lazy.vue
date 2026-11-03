<template>
  <div>
    <RenderCacheable :cache-key="route.query.key?.toString()">
      <LazyCaseLazyFirst />
    </RenderCacheable>
    <RenderCacheable>
      <LazyCaseLazySecond />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#imports'

const route = useRoute()
</script>
