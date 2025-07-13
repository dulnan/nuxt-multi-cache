<template>
  <div>
    <button id="button" @click="onClick">Toggle server island component</button>
    <div>
      Index on client: <span id="index-on-client">{{ index }}</span>
    </div>
    <div v-if="isVisible">
      <CaseInsideServerIsland :index />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '#imports'

const isVisible = ref(false)
const index = ref(0)

function onClick() {
  isVisible.value = !isVisible.value
  if (isVisible.value) {
    index.value++
  }
}
</script>
