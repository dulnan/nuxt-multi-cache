<template>
  <div v-if="data" id="with-async-data">{{ data.api }}</div>
</template>

<script lang="ts" setup>
import { useAsyncData } from '#imports'

const { data } = await useAsyncData('withAsyncData', () => {
  return $fetch<{
    api: string
    now: number
    cacheTags: string[]
  }>('/api/test')
})

useComponentCache((helper) => {
  helper
    .addTags(['tag-from-component'])
    .addPayloadKeys('withAsyncData')
    .addTags(data.value?.cacheTags)
})

console.log('WithAsyncData component is being rendered.')
</script>
