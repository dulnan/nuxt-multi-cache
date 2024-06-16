<template>
  <div>
    <RenderCacheable :async-data-keys="['random_data_in_cached_component']">
      <TestComponent />
    </RenderCacheable>
  </div>
</template>

<script lang="ts" setup>
import { useRouteCache } from '#imports'
import TestComponent from './../components/Test.vue'

useRouteCache((helper) => {
  helper.setUncacheable()
})
</script>
