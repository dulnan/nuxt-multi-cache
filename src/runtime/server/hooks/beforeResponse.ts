import { type H3Event, getResponseHeader, setResponseHeader } from 'h3'
import { parse } from '@tusbar/cache-control'
import { cdnCacheControlHeader } from '#nuxt-multi-cache/config'

function getHeaderValue(event: H3Event, name: string): string | undefined {
  const value = getResponseHeader(event, name)
  if (value === undefined) {
    return
  }

  return Array.isArray(value) ? value.join(', ') : String(value)
}

/**
 * Add the `private` directive to a Cache-Control header value.
 *
 * `public` (and a `private` limited to some fields) is removed, the other
 * directives are kept as they are.
 */
export function addPrivateDirective(value?: string): string {
  const directives = (value ?? '')
    // Commas that are not inside quotes, e.g. no-cache="set-cookie, foo".
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((directive) => directive.trim())
    .filter((directive) => {
      const name = directive.split('=')[0]!.trim().toLowerCase()
      return directive && name !== 'public' && name !== 'private'
    })

  return ['private', ...directives].join(', ')
}

/**
 * Callback for the 'beforeResponse' nitro hook.
 *
 * If the CDN header marks the response as private or no-store, `private` is
 * also added to the Cache-Control header. Not every CDN honors these
 * directives in its own header: Fastly, for example, ignores them in
 * Surrogate-Control and only passes responses with `Cache-Control: private`.
 *
 * This happens as late as possible, so that a Cache-Control header set by the
 * app after the CDN headers were applied (e.g. in a render:response hook) is
 * merged too.
 */
export function onBeforeResponse(event: H3Event) {
  if (
    event.node?.res?.headersSent ||
    cdnCacheControlHeader.toLowerCase() === 'cache-control'
  ) {
    return
  }

  const cdnControl = getHeaderValue(event, cdnCacheControlHeader)
  if (!cdnControl) {
    return
  }

  const parsed = parse(cdnControl)
  if (!parsed.private && !parsed.noStore) {
    return
  }

  setResponseHeader(
    event,
    'cache-control',
    addPrivateDirective(getHeaderValue(event, 'cache-control')),
  )
}
