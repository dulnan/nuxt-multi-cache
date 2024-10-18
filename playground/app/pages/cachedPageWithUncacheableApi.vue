<template>
  <div>
    <h1>Cacheable Page using uncacheable API data</h1>
    <div id="api-data">{{ data?.data }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useFetch, useRouteCache } from '#imports'

useRouteCache((v) => {
  v.setCacheable()
})

const { data } = await useFetch('/api/uncacheableApi')
</script>
