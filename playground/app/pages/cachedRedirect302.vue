<template>
  <div />
</template>

<script lang="ts" setup>
import { navigateTo, useRouteCache } from '#imports'

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})

// A random target shows if the redirect was served from cache.
const random = Math.floor(Math.random() * 1000000000)
await navigateTo('/?random=' + random, { redirectCode: 302 })
</script>
