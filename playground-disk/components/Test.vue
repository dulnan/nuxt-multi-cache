<template>
  <div>
    <div id="cached-component-number">{{ random }}</div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from '#imports'

const { data: random } = await useAsyncData(
  'random_data_in_cached_component',
  () => {
    return Promise.resolve('RANDOM_NUMBER__' + Date.now())
  },
)
</script>
