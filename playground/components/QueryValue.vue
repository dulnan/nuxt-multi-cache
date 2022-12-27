<template>
  <div>
    <p>The query value is: {{ queryValue }}</p>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'nuxt/app'
import { computed } from 'vue'
const route = useRoute()

const queryValue = computed(() => {
  return route.query.v
})
</script>
