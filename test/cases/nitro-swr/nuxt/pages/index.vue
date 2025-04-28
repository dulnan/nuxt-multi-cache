<template>
  <div>
    <div id="current-time">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { useRequestEvent, useAsyncData, useDataCacheCallback } from '#imports'

const event = useRequestEvent()

const { data } = await useAsyncData(() =>
  useDataCacheCallback(
    'current-time',
    () => {
      return {
        value: Date.now().toString(),
        maxAge: 600,
        cacheTags: ['time'],
      }
    },
    event,
  ),
)
</script>
