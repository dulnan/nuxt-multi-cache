<template>
  <div>
    <h1>useCachedAsyncData with a falsy value</h1>
    <div id="value">{{ data }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData } from '#imports'

// The handler always returns 0, but counts how often it ran.
const { data } = await useCachedAsyncData(
  'falsy-value',
  () => $fetch('/api/falsyCounter').then(() => 0),
  {
    serverMaxAge: 60,
  },
)
</script>
