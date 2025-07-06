<template>
  <div>
    <RenderCacheable :max-age="3" cache-key="inside-server-island">
      <TimestampWithIndex :index />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from '#imports'

defineProps<{
  index: number | string
}>()

onMounted(() => {
  console.log('should not be logged')
})
</script>
