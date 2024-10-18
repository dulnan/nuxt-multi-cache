<template>
  <div v-if="data" id="with-async-data">{{ data.api }}</div>
</template>

<script lang="ts" setup>
import { useAsyncData } from '#imports'

const { data } = await useAsyncData<any>('withAsyncData', () => {
  return $fetch('/api/test').then((v) => {
    return v
  })
})
</script>
