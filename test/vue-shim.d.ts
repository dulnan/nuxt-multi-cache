import Vue from 'vue'
import '@nuxt/types'
import { CachePlugin } from './../'

declare module 'vue/types/vue' {
  interface Vue {
    $cache: CachePlugin
  }
}

declare module '@nuxt/types' {
  interface Context {
    $cache: CachePlugin
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    serverCacheKey?: (props: any) => string | boolean
  }
}
