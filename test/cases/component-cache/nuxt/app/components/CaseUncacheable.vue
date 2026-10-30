<template>
  <div>
    <div id="timestamp" v-html="time" />
  </div>
</template>

<script setup lang="ts">
import { useComponentCache, useAsyncData } from '#imports'

const { data: time } = await useAsyncData('case-uncacheable', () => {
  return Promise.resolve(Date.now())
})

useComponentCache((helper) => {
  helper.setUncacheable()
})
</script>
