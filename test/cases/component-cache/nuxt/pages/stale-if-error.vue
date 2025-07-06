<template>
  <div>
    <RenderCacheable
      :max-age="1"
      cache-key="case-stale-if-error"
      stale-if-error="7d"
    >
      <CaseStaleIfError :throw-error />
    </RenderCacheable>
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from '#imports'

const route = useRoute()

const throwError = computed(() => {
  return route.query.throwError === 'true'
})
</script>
