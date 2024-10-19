<template>
  <nav class="menu">
    <div class="menu-label">User Management</div>
    <ul class="menu-list">
      <li v-for="user in users">
        <UserMenuItem :user-id="user.userId" :username="user.username" />
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import { useAsyncData } from '#imports'

const { data: users } = await useAsyncData('navbar', () => {
  return $fetch('/api/getUsers').then((v) => {
    return v
  })
})
</script>
