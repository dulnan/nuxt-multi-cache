<template>
  <div id="home">
    <h1>useCachedAsyncData</h1>
    <div v-if="data">
      <h2 id="time">{{ data.cachedTime }}</h2>
      <button @click="onClick">Refresh</button>
      <ul>
        <li v-for="user in data.transformedUserList" :key="user.userId">
          {{ user.email }}
        </li>
      </ul>
    </div>

    <NuxtLink to="/" id="go-to-home">Go to Home</NuxtLink>

    <div id="not-cached-data">{{ notCachedData }}</div>
    <div id="no-max-age">{{ noMaxAge }}</div>
  </div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData, useRoute } from '#imports'
import type { UsersWithCacheability } from '~~/server/api/getUsersWithCacheability'

const route = useRoute()

const vary = computed(() => route.query.vary?.toString() ?? '-default')

const { data, refresh } = await useCachedAsyncData(
  'all-users--' + vary.value,
  () => $fetch<UsersWithCacheability>('/api/getUsersWithCacheability'),
  {
    serverMaxAge: 5,
    clientMaxAge: 5,
    serverCacheTags: function (data) {
      return data.cacheTags
    },
    transform: function (data) {
      return {
        transformedUserList: data.users,
        cachedTime: data.currentTime,
      }
    },
    default: function () {
      return {
        transformedUserList: [],
        cachedTime: null,
      }
    },
  },
)

const { data: notCachedData } = await useCachedAsyncData(
  'not-cached-data' + vary.value,
  () => Promise.resolve(Date.now().toString()),
  {
    serverMaxAge: 0,
    clientMaxAge: 0,
  },
)

const { data: noMaxAge } = await useCachedAsyncData(
  'no-max-age' + vary.value,
  () => Promise.resolve(Date.now().toString()),
  {
    serverMaxAge: 'never',
    clientMaxAge: 'never',
  },
)

function onClick() {
  refresh()
}
</script>
