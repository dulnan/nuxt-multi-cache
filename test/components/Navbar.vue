<template>
  <div class="navbar">
    <ul>
      <li>
        <nuxt-link :to="{ name: 'index' }">Home</nuxt-link>
      </li>
      <li v-for="link in links" :key="link.slug">
        <nuxt-link :to="getLink(link.slug)">{{ link.label }}</nuxt-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
const { getServerCacheKey } = require('./../../client')

export default Vue.extend({
  name: 'Navbar',
  props: {
    links: {
      type: Array,
      default: () => [],
    },
  },

  serverCacheKey() {
    return getServerCacheKey('default', ['cache_group:navbar'])
  },

  computed: {
    hash() {
      return this.$route.query.hash
    },
  },

  methods: {
    getLink(slug: string) {
      return {
        name: 'slug',
        params: {
          slug,
        },
      }
    },
  },
})
</script>

<style lang="scss">
.navbar {
  background: black;
  color: white;
  ul {
    list-style-type: none;
    display: flex;
    margin: 0;
    padding: 0;
    font-size: 1.5rem;

    li {
      a {
        text-decoration: none;
        color: inherit;
        display: block;
        padding: 0.5em 1em;

        &.nuxt-link-exact-active {
          background: #333;
        }
      }
    }
  }
}
</style>
