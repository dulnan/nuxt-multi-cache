import { $fetch } from '@nuxt/test-utils'

export function purgeAll() {
  return $fetch('/__nuxt_multi_cache/purge/all', {
    method: 'post',
  })
}
