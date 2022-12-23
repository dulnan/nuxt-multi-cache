<template>
  <nuxt-link class="teaser" :to="to">
    <h3>{{ username }}</h3>
    <p>{{ userId }}</p>
    <p>{{ email }}</p>
  </nuxt-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  userId: String,
  username: String,
  email: String,
})

const to = computed(() => {
  return '/user/' + props.userId
})
</script>
