<template>
  <div id="data-cache-value">COUNTRY COOKIE: {{ country }}</div>
</template>

<script lang="ts" setup>
import { useRouteCache, useCookie } from '#imports'

const country = useCookie('country', {
  default() {
    return 'us'
  },
})

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000)
})
</script>
