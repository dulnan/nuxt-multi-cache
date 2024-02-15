import { $fetch } from '@nuxt/test-utils/e2e'

export default function purgeAll() {
  return $fetch('/__nuxt_multi_cache/purge/all', {
    method: 'post',
  })
}
