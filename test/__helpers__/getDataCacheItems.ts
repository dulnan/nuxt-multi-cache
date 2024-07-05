import { $fetch } from '@nuxt/test-utils/e2e'

export default function () {
  return $fetch(`/__nuxt_multi_cache/stats/data`, {
    method: 'get',
  })
}
