<template>
  <div>
    <div id="data">{{ data }}</div>
    <div id="error" v-text="error" />
    <div id="status" v-text="status" />
  </div>
</template>

<script setup lang="ts">
import {
  useDataCacheCallback,
  useRoute,
  useAsyncData,
  computed,
} from '#imports'

const route = useRoute()

const throwError = computed(() => route.query.throwError === 'true')

const { data, error, status } = await useAsyncData('stale-if-error', () => {
  return useDataCacheCallback('stale-if-error', (helper) => {
    if (helper) {
      helper.setStaleIfError('1m').setMaxAge(2)
    }

    if (throwError.value) {
      throw new Error('Unexpected Error')
    }
    return 'Value: ' + Date.now()
  })
})
</script>
