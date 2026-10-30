<template>
  <div>Cacheable component</div>
</template>

<script setup lang="ts">
import { useComponentCache } from '#imports'

useComponentCache((helper) => {
  helper.addTags(['tag-from-component']).setMaxAge(1000).setStaleIfError(50000)
})
</script>
