<template>
  <div id="random-number">{{ random }}</div>
</template>

<script lang="ts" setup>
import { useRouteCache, useState } from '#imports'

const random = useState('random_data', () => {
  return 'RANDOM_NUMBER__' + Math.round(Math.random() * 1000000000) + '__'
})

useRouteCache((helper) => {
  helper.setCacheable()
})
</script>
