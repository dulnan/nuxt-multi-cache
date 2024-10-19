<template>
  <div>This is a cached page.</div>
</template>

<script lang="ts" setup>
import { useRouteCache } from '#imports'

useRouteCache((helper) => {
  helper.setCacheable()
})
</script>
