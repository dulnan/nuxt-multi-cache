<template>
  <div>
    <h1>Test staleIfError</h1>

    <div class="buttons">
      <button
        id="button-success"
        @click.prevent="doRequest(false)"
        class="button"
      >
        Make success request
      </button>
      <button id="button-fail" @click.prevent="doRequest(true)" class="button">
        Make error request
      </button>
    </div>

    <div id="api-result">{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '#imports'

const data = ref('0:')
const counter = ref(0)

async function doRequest(throwError?: boolean) {
  counter.value++
  try {
    const result = await $fetch('/api/testStaleIfError', {
      headers: {
        'x-nuxt-throw-error': throwError ? 'true' : '',
      },
      retry: 0,
    })
    data.value = `${counter.value}: ${result.data}`
  } catch (e) {
    data.value = `${counter.value}: Error`
  }
}
</script>
