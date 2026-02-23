<template>
  <div id="random-number">{{ random }}</div>
  <div id="async-data">{{ data }}</div>
</template>

<script lang="ts" setup>
import { useAsyncData, useRouteCache, useState } from '#imports'

const random = useState('random_data', () => {
  return 'RANDOM_NUMBER__' + Math.floor(Math.random() * 1000000000) + '__'
})

const { data } = await useAsyncData(() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('ASYNC_DATA__' + Math.floor(Math.random() * 1000000000) + '__')
    }, 2000)
  })
})

useRouteCache((helper) => {
  helper
    .setCacheable()
    .addTags(['test_tag'])
    .setMaxAge(4)
    .allowStaleWhileRevalidate()
    .allowBackgroundRevalidation()
})
</script>
