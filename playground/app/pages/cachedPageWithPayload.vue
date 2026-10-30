<template>
  <div id="data-cache-value">RANDOM[{{ random }}]</div>
</template>

<script lang="ts" setup>
import { useRouteCache, useAsyncData } from '#imports'

// This page has an `isr` route rule, so Nuxt renders `_payload.json` requests
// for it.
const { data: random } = await useAsyncData(() => {
  return Promise.resolve(Math.floor(Math.random() * 1000000000).toString())
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})
</script>
