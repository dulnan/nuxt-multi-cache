<template>
  <div id="results">{{ data }}</div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData, useRoute } from '#imports'

const route = useRoute()
const query = String(route.query.q ?? '')

// The cache key is built from the query.
const { data } = await useCachedAsyncData(
  `search:${query}`,
  () => Promise.resolve(`RESULTS:${query}`),
  { serverMaxAge: 3600 },
)
</script>
