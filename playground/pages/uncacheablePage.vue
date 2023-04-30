<template>
  <div>{{ random }}</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouteCache } from '#imports'

const random = computed(() => {
  return 'RANDOM_NUMBER__' + Math.round(Math.random() * 1000000000) + '__'
})

useRouteCache((helper) => {
  helper.setUncacheable()
})
</script>
