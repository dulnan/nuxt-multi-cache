<template>
  <div class="float-bottom">
    <h1>
      Cache API Playground - <button @click="getCache()">Refresh</button> -
      <a @click="purgeAll">Purge All</a>
    </h1>
    <div v-if="cache">
      Status: {{ cache.status }}<br />
      Rows: {{ cache.total }} <br />
      <div v-for="row in cache.rows" :key="row.key">
        <div>
          <b>{{ row.key }}</b>
        </div>
        <div class="scroll-area">
          <vue-json-pretty :data="getData(row.data)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '#imports'

type StatsResponse = {
  status: string
  rows: any[]
  total: number
}

const cache = ref<StatsResponse | null>(null)

const getCache = (type = 'route') => {
  $fetch(`/__nuxt_multi_cache/stats/${type}`, {
    headers: {
      'x-nuxt-multi-cache-token': 'hunter2',
    },
  }).then((res) => {
    cache.value = res
  })
}

const purgeAll = () => {
  $fetch('http://localhost:3000/__nuxt_multi_cache/purge/all', {
    method: 'POST',
    headers: {
      'x-nuxt-multi-cache-token': 'hunter2',
    },
  }).then(() => getCache())
}

getCache()

const getData = (data: string) => {
  const cacheItem = data.split('<CACHE_ITEM>')
  const headers = cacheItem[0]
  if (!headers) {
    return
  }
  try {
    return JSON.parse(headers)
  } catch (e) {
    return data
  }
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}

.float-bottom {
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 1rem;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.1);
  width: 600px;
}
.scroll-area {
  max-height: 150px;
  overflow-y: scroll;
  max-width: 500px;
}
</style>
