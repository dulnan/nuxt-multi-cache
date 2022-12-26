<template>
  <div>This page has special surrogate control headers.</div>
</template>

<script lang="ts" setup>
import { useRouteCache } from '#imports'

const routeCache = useRouteCache()
routeCache.setMaxAge(6000000)
routeCache.setCacheable()
</script>
