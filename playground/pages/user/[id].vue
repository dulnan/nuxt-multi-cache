<template>
  <div v-if="user">
    <h1>{{ user.userId }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useAsyncData } from 'nuxt/app'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = computed(() => {
  return route.params.id as string
})

const { data: user } = await useAsyncData('user_' + userId.value, () => {
  return $fetch('/api/getUser/' + userId.value).then((v) => {
    return v
  })
})
</script>
