<template>
  <nav class="menu">
    <div class="menu-label">Main Menu</div>
    <ul class="menu-list">
      <li v-for="route in routes" :key="route.name">
        <NuxtLink :to="route.path" :id="'route-' + route.name">{{
          route.name
        }}</NuxtLink>
      </li>
    </ul>
    <div class="menu-label">User Management</div>
    <ul class="menu-list">
      <li v-for="user in users">
        <UserMenuItem :user-id="user.userId" :username="user.username" />
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import { useAsyncData, useRouter } from '#imports'

const { data: users } = await useAsyncData('navbar', () => {
  return $fetch('/api/getUsers').then((v) => {
    return v
  })
})

const router = useRouter()

const routes = router.getRoutes().map((route) => {
  return {
    name: route.name?.toString() || '',
    path: route.path,
  }
})
</script>
