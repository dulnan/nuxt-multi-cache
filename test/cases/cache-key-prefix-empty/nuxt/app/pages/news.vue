<template>
  <div>{{ isPremium ? 'PREMIUM-CONTENT' : 'PUBLIC-CONTENT' }}</div>
</template>

<script lang="ts" setup>
import { useCookie } from '#imports'

const isPremium = useCookie('plan').value === 'premium'
</script>
