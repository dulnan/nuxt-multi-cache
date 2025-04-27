<template>
  <div>
    <div id="current-time">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
const event = useRequestEvent()

const { data } = await useAsyncData(() => {
  return useDataCacheCallback(
    'current-time',
    () => {
      return {
        value: Date.now().toString(),
      }
    },
    event,
  )
})
</script>
