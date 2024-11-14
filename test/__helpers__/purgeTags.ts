import { $fetch } from '@nuxt/test-utils/e2e'

export default function purgeTags(tags: string[] | string) {
  const body: string[] = Array.isArray(tags) ? tags : [tags]
  return $fetch(`/__nuxt_multi_cache/purge/tags`, {
    method: 'post',
    body: JSON.stringify(body),
  })
}
