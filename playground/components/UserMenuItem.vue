<template>
  <nuxt-link :to="to">
    <div>{{ username }}</div>
  </nuxt-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  userId: String,
  username: String,
})

const to = computed(() => {
  return '/user/' + props.userId
})
</script>
