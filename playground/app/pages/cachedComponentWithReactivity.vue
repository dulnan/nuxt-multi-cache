<template>
  <div>
    <div>
      <button @click="count++" id="increment">Increment</button>
      <button @click="count = 0" id="reset">Reset</button>
    </div>

    <RenderCacheable max-age="permanent">
      <ReactiveTest :count v-if="count !== 3" />
    </RenderCacheable>
  </div>
</template>

<script setup lang="ts">
const count = ref(0)
</script>
