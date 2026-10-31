<template>
  <div>PAGE:checkout {{ cart }}</div>
</template>

<script lang="ts" setup>
import { useCookie } from '#imports'

// User-specific: The route cache must never store this page.
const cart = useCookie('cart')
</script>
