<template>
  <div>Page</div>
</template>

<script setup lang="ts">
import { useRouteCache } from '#imports'

useRouteCache((route) => {
  route.setCacheable().setMaxAge(3600)
})
</script>
