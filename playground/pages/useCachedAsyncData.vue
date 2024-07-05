<template>
  <div id="home">
    <h1>useCachedAsyncData</h1>
    <div v-if="data">
      <h2 id="time">{{ data.cachedTime }}</h2>
      <ul>
        <li v-for="user in data.transformedUserList" :key="user.userId">
          {{ user.email }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData } from '#imports'
import type { UsersWithCacheability } from '~/server/api/getUsersWithCacheability'

const { data } = await useCachedAsyncData(
  'all-users',
  () => $fetch<UsersWithCacheability>('/api/getUsersWithCacheability'),
  {
    maxAge: 5,
    cacheTags: function (data) {
      return data.cacheTags
    },
    transform: function (data) {
      return {
        transformedUserList: data.users,
        cachedTime: data.currentTime,
      }
    },
  },
)
</script>
