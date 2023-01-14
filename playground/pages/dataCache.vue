<template>
  <div id="home">
    <h1>Data Cache</h1>
    <p>{{ data }}</p>
  </div>
</template>

<script lang="ts" setup>
import { useDataCache, useAsyncData } from '#imports'

function getData(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.round(Math.random() * 100000000).toString())
    }, 500)
  })
}

const { data } = useAsyncData(async () => {
  const { value, addToCache } = await useDataCache<string>('pageDataCacheTest')
  if (value) {
    return value
  }

  const result = await getData()
  addToCache(result)

  return result
})
</script>
