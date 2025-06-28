<template>
  <div>
    <h1 id="background-heading">
      <span>This has some styles defined in the component.</span>
      <span id="timestamp">{{ data }}</span>
    </h1>
  </div>
</template>

<script lang="ts" setup>
import { useAsyncData } from '#imports'

const { data } = await useAsyncData('timestamp', () => {
  return Promise.resolve(Date.now().toString())
})
</script>

<style>
#background-heading {
  background: red;
}
</style>
