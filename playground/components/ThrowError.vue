<template>
  <div>Throwing an error</div>
</template>

<script lang="ts" setup>
import { useRoute } from '#imports'
const route = useRoute()

if (route.query.throw) {
  throw new Error('ERROR!')
}
</script>
