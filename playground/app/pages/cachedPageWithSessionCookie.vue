<template>
  <div id="data-cache-value">SESSION COOKIE: {{ session }}</div>
</template>

<script lang="ts" setup>
import { useRouteCache, useCookie } from '#imports'

const session = useCookie('SESSION', {
  default() {
    return Math.floor(Math.random() * 1000).toString()
  },
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})
</script>
