<template>
  <div id="data-cache-value">RANDOM[{{ random }}]</div>
</template>

<script lang="ts" setup>
import { useCDNHeaders, useRouteCache, useAsyncData } from '#imports'

const { data: random } = await useAsyncData(() => {
  return Promise.resolve(Math.round(Math.random() * 1000000000).toString())
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})

useCDNHeaders((v) => {
  v.set('maxStale', true).public().addTags(['one', 'two', 'three'])
})
</script>
