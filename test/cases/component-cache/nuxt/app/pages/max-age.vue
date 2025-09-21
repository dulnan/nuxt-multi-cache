<template>
  <div>
    <RenderCacheable :max-age cache-key="case-max-age">
      <CaseMaxAge />
    </RenderCacheable>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, computed } from '#imports'
import type { MaxAge } from '~/src/runtime/helpers/maxAge'

function isIntegerString(value: string): boolean {
  return /^\d+$/.test(value)
}

const route = useRoute()

const maxAge = computed(() => {
  const value = route.query.maxAge as string
  if (value === '-1') {
    return -1
  } else if (isIntegerString(value)) {
    return parseInt(value)
  }

  return value as MaxAge
})
</script>
