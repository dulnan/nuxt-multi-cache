<template>
  <div>Override max age.</div>
</template>

<script setup lang="ts">
import { useComponentCache } from '#imports'

useComponentCache((helper) => {
  helper.setMaxAge(10)
})
</script>
