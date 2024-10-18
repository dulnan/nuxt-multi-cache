<template>
  <div v-if="user">
    <h1>{{ user.userId }}</h1>
  </div>
</template>

<script lang="ts" setup>
import { useAsyncData, computed, useRoute } from '#imports'

const route = useRoute()
const userId = computed(() => {
  return route.params.id as string
})

const { data: user } = await useAsyncData('user_' + userId.value, () => {
  return $fetch<any>('/api/getUser/' + userId.value).then((v) => {
    return v
  })
})
</script>
