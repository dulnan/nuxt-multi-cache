<template>
  <div>This page has special surrogate control headers.</div>
</template>

<script lang="ts" setup>
import { useRouteCache, useCDNHeaders } from '#imports'

useRouteCache((helper) => {
  helper.setMaxAge(5).setCacheable()
})

useCDNHeaders((helper) => {
  helper.addTags(['hello']).public()
})
</script>
