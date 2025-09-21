<template>
  <div>
    <div id="timestamp" v-html="time" />
  </div>
</template>

<script setup lang="ts">
import { useComponentCache, useAsyncData } from '#imports'

const { data: time } = await useAsyncData('case-cacheable', () => {
  return Promise.resolve(Date.now())
})

useComponentCache((helper) => {
  helper.setCacheable().addPayloadKeys('case-cacheable')
})
</script>
