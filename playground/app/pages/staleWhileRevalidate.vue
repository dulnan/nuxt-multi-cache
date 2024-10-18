<template>
  <div>
    <h1>Test staleIfError</h1>

    <button
      id="button-fast"
      class="button"
      @click.prevent="() => addItem(false)"
    >
      Get random number fast
    </button>
    <button
      id="button-slow"
      class="button"
      @click.prevent="() => addItem(true)"
    >
      Get random number (2s response time)
    </button>

    <div class="table-container">
      <table
        id="results"
        style="font-family: monospace"
        class="table is-fullwidth"
      >
        <tbody>
          <StaleWhileRevalidate
            v-for="item in items"
            :key="item.index"
            v-bind="item"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '#imports'

type Item = {
  index: number
  slow: boolean
}

let index = 0

const items = ref<Item[]>([])

function addItem(slow: boolean) {
  items.value.push({ index, slow })
  index++
}
</script>
