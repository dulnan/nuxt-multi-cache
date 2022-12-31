<template>
  <div id="home">
    <div>HOME</div>
    <RenderCacheable
      v-for="user in users"
      :key="user.userId"
      :cache-key="user.userId"
    >
      <UserTeaser
        :user-id="user.userId"
        :username="user.username"
        :email="user.email"
      />
    </RenderCacheable>
  </div>
</template>

<script lang="ts" setup>
import { useAsyncData } from 'nuxt/app'

const { data: users } = await useAsyncData(() => {
  return $fetch('/api/getUsers').then((v) => {
    return v
  })
})
</script>
