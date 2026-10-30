<template>
  <div>Uncacheable component</div>
</template>

<script setup lang="ts">
import { useComponentCache } from '#imports'

useComponentCache((helper) => {
  helper.setUncacheable()
})
</script>
