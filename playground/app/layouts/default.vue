<template>
  <div class="main-layout">
    <header>
      <Navbar />
    </header>
    <main>
      <slot />
      <api-playground v-if="routeCacheEnabled" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { routeCacheEnabled } from '#nuxt-multi-cache/config'
import ApiPlayground from '../components/apiPlayground.vue'
</script>

<style>
.main-layout {
  display: grid;
  grid-template-columns: 20rem 1fr;
  grid-gap: 2rem;
  padding: 2rem;
}
</style>
