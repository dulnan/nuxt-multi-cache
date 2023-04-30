<template>
  <div>RANDOM[{{ random }}]</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import { useRouteCache } from '#imports'

const { data: random } = await useAsyncData(() => {
  return Promise.resolve(Math.round(Math.random() * 1000000000).toString())
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})
</script>
