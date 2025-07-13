<template>
  <div id="home">
    <h1>useCachedAsyncData (with reactive key)</h1>
    <div>
      <button id="increment" @click="count++">Increment</button>
      <button id="decrement" @click="count--">Decrement</button>
      <button id="refresh" @click="() => refresh()">Refresh</button>
      <table class="table">
        <tbody>
          <tr>
            <th>Local</th>
            <td>{{ count }}</td>
            <td></td>
          </tr>
          <tr>
            <th>API</th>
            <td id="api-value">{{ data?.value }}</td>
            <td id="api-timestamp">{{ data?.currentTime }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCachedAsyncData } from '#imports'

const count = ref(0)

const currentKey = computed(() => 'reactive-key-' + count.value)

const { data, refresh } = await useCachedAsyncData(
  currentKey,
  () =>
    $fetch<{ value: string; cacheTags: string[]; currentTime: number }>(
      '/api/returnQueryParam',
      {
        params: {
          value: count.value,
        },
      },
    ),
  {
    serverMaxAge: 5,
    clientMaxAge: 10,
    serverCacheTags: function (data) {
      return data.cacheTags
    },
  },
)
</script>
