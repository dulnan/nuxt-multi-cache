<template>
  <div>
    <h1>Test staleIfError</h1>

    <div class="buttons">
      <button @click.prevent="doRequest(false)" class="button">
        Make success request
      </button>
      <button @click.prevent="doRequest(true)" class="button">
        Make error request
      </button>
    </div>

    <div>{{ data }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '#imports'

const data = ref('')

async function doRequest(throwError?: boolean) {
  const result = await $fetch('/api/testStaleIfError', {
    headers: {
      'x-nuxt-throw-error': throwError,
    },
  })
  console.log(result)
}
</script>
