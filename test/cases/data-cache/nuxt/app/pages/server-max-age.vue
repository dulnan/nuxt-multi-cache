<template>
  <div id="results">{{ data }}</div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData, useRoute } from '#imports'

const route = useRoute()

// "?max=…" sets the server max age, without it the option is left out.
const max = route.query.max?.toString()
const serverMaxAge =
  max === undefined
    ? undefined
    : /^\d+$/.test(max)
      ? Number(max)
      : (max as 'never')

const { data } = await useCachedAsyncData(
  'server-max-age',
  () => Promise.resolve('RENDERED'),
  { serverMaxAge },
)
</script>
