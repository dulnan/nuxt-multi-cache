<template>
  <div>
    <div id="current-time">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { useFetch } from '#imports'

const { data } = await useFetch('/api/handler-with-swr', {
  transform: function (data: any) {
    return data?.time
  },
})
</script>
