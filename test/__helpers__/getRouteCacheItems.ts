import { $fetch } from '@nuxt/test-utils/e2e'

export default function (): Promise<any> {
  return $fetch(`/__nuxt_multi_cache/stats/route`, {
    method: 'get',
  })
}
