<template>
  <div id="timestamp">{{ time }}</div>
</template>

<script setup lang="ts">
const time = Date.now()
</script>
