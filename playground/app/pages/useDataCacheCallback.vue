<template>
  <div>
    <div id="timestamp">{{ data?.timestamp }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useDataCacheCallback, useAsyncData } from '#imports'

const { data } = await useAsyncData(() => {
  return useDataCacheCallback('data-cache-callback-key', function (helper) {
    if (helper && import.meta.server) {
      helper
        .addTags(['one', 'two', 'three'])
        .setMaxAge('4h')
        .setStaleIfError('1d')
    }

    return {
      timestamp: Date.now(),
    }
  })
})
</script>
