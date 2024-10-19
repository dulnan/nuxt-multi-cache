<template>
  <div id="home">
    <h1>Data Cache</h1>
    <p id="data-cache-value">{{ data }}</p>
  </div>
</template>

<script lang="ts" setup>
import { useDataCache, useAsyncData } from '#imports'

function getData(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Success')
    }, 500)
  })
}

const { data } = useAsyncData(async () => {
  const { value, addToCache } = await useDataCache<string>(
    'spaPageDataCacheTest',
  )
  if (value) {
    return value
  }

  const result = await getData()
  addToCache(result)

  return result
})
</script>
