<template>
  <div id="data-cache-value">RANDOM[{{ random }}]</div>
  <div id="data-cache-value">COOKIE COUNTER[{{ counter }}]</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAsyncData, useCookie } from 'nuxt/app'
import { useRouteCache } from '#imports'

const counter = useCookie('counter')
counter.value = counter.value || Math.round(Math.random() * 1000)

const { data: random } = await useAsyncData(() => {
  return Promise.resolve(Math.round(Math.random() * 1000000000).toString())
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})
</script>
