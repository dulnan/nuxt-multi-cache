import { $fetch } from '@nuxt/test-utils'

export default function purgeAll() {
  return $fetch('/__nuxt_multi_cache/purge/all', {
    method: 'post',
  })
}
