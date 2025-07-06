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
    (helper) => {
      helper?.setMaxAge(600).addTags('time')
      return Date.now().toString()
    },
    event,
  ),
)
</script>
