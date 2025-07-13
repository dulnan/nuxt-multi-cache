<template>
  <div>
    <h1>This page uses the route cache together with "h3-compression".</h1>
    <div id="random-number">{{ random }}</div>
  </div>
</template>

<script setup lang="ts">
import { useRouteCache, useState } from '#imports'

const random = useState('compression_random_number', () => {
  return Math.floor(Math.random() * 100000000)
})

useRouteCache((v) => v.setCacheable().setMaxAge(1000))
</script>
