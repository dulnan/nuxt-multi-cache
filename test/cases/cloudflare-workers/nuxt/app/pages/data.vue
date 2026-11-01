<template>
  <div id="data">{{ data }}</div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData } from '#imports'

const { data } = await useCachedAsyncData(
  'render-id',
  () => Promise.resolve(crypto.randomUUID()),
  { serverMaxAge: 3600 },
)
</script>
