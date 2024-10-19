<template>
  <div>
    <ThrowError />
  </div>
</template>

<script lang="ts" setup>
import { useRouteCache } from '#imports'

useRouteCache((helper) => {
  helper.setCacheable().setMaxAge(9000).setStaleIfError(600)
})
</script>
