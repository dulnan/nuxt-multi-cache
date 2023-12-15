import { $fetch } from '@nuxt/test-utils/e2e'

export default function purgeByKey(cache: string, keys: string[] | string) {
  const body: string[] = Array.isArray(keys) ? keys : [keys]
  return $fetch(`/__nuxt_multi_cache/purge/${cache}`, {
    method: 'post',
    body: JSON.stringify(body),
  })
}
