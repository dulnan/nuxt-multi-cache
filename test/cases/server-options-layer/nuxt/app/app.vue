<template>
  <div>Hello</div>
</template>

<script lang="ts" setup>
import { useRouteCache } from '#imports'

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(3600)
})
</script>
