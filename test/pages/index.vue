<template>
  <div class="container">
    <div>
      <h1 class="title">{{ random }}</h1>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  asyncData(ctx) {
    ctx.$cache.route.setCacheable()
    ctx.$cache.route.addTags(['home'])
    return {
      random: Math.round(Math.random() * 100000000000000).toString(),
    }
  },

  data() {
    return {
      random: '',
    }
  },
})
</script>

<style>
.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
