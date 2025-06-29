<template>
  <div>
    <div id="timestamp" v-html="time" />
  </div>
</template>

<script setup lang="ts">
import { useComponentCache, useAsyncData } from '#imports'
import type { MaxAge } from '~/dist/runtime/helpers/maxAge'

const props = defineProps<{
  maxAge?: MaxAge
}>()

const { data: time } = await useAsyncData('case-max-age', () => {
  return Promise.resolve(Date.now())
})

useComponentCache((helper) => {
  helper.addPayloadKeys('case-max-age')
  if (props.maxAge) {
    helper.setMaxAge(props.maxAge)
  }
})
</script>
