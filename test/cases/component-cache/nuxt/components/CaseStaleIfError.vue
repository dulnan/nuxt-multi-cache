<template>
  <div>
    <div id="timestamp" v-html="time" />
  </div>
</template>

<script setup lang="ts">
import { useAsyncData, useComponentCache } from '#imports'

const props = defineProps<{
  throwError: boolean
}>()

const { data: time } = await useAsyncData('case-stale-if-error', () => {
  return Promise.resolve(Date.now())
})

if (props.throwError && import.meta.server) {
  throw new Error('Error thrown in component.')
}

useComponentCache((cache) => {
  cache.addPayloadKeys('case-stale-if-error')
})
</script>
