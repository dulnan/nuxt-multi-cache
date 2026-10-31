import http from 'node:http'
import path from 'node:path'
import { setup, $fetch, url } from '@nuxt/test-utils/e2e'
import { beforeEach, describe, expect, test } from 'vitest'
import type { CacheStatsResponse } from '~/src/runtime/types'

await setup({
  server: true,
  logLevel: 0,
  runner: 'vitest',
  build: true,
  rootDir: path.resolve(__dirname, './nuxt'),
})

const ADMIN_COOKIE = 'admin=yes'

const CART = 'secret-cart-contents'

/**
 * Send a GET request with the path exactly as given.
 *
 * fetch() would normalize paths such as "//contact" or "/a/%2e%2e/b" before
 * sending them, but any HTTP client can send them as they are.
 */
function rawGet(
  requestPath: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: string }> {
  const target = new URL(url('/'))
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: target.hostname,
        port: target.port,
        path: requestPath,
        method: 'GET',
        headers,
      },
      (response) => {
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => (body += chunk))
        response.on('end', () =>
          resolve({ status: response.statusCode ?? 0, body }),
        )
      },
    )
    request.on('error', reject)
    request.end()
  })
}

function getRouteCacheKeys(): Promise<string[]> {
  return $fetch<CacheStatsResponse<string>>('/__nuxt_multi_cache/stats/route', {
    headers: { cookie: ADMIN_COOKIE },
  }).then((response) => response.rows.map((row) => row.key))
}

describe('The route cache with unusual request paths', () => {
  beforeEach(async () => {
    await $fetch('/__nuxt_multi_cache/purge/all', {
      method: 'post',
      headers: { cookie: ADMIN_COOKIE },
    })
  })

  test('stores normal paths', async () => {
    await rawGet('/contact')
    expect(await getRouteCacheKeys()).toEqual(['contact'])
    expect((await rawGet('/contact')).body).toContain('PAGE:contact')
  })

  test('does not store the page rendered for "//contact" as /contact', async () => {
    // Nuxt renders "//contact" as the protocol-relative URL of the host
    // "contact", so it renders the home page.
    await rawGet('//contact')

    const response = await rawGet('/contact')
    expect(response.body).toContain('PAGE:contact')
    expect(response.body).not.toContain('PAGE:home')
  })

  test.each([
    // Rendered as /checkout, but `applies` gets "/x/checkout".
    ['//x/checkout', '/x/checkout'],
    // Rendered as /checkout, but `applies` gets the encoded path.
    ['/%63heckout', '/%63heckout'],
  ])(
    'does not store the page excluded by applies when requested as %s',
    async (victimPath, attackerPath) => {
      const victim = await rawGet(victimPath, { cookie: `cart=${CART}` })
      expect(victim.body).toContain(`PAGE:checkout ${CART}`)

      const attacker = await rawGet(attackerPath)
      expect(attacker.body).not.toContain(CART)
    },
  )

  test.each(['/api/files/%2e%2e/%2e%2e/contact', '/api/files/../../contact'])(
    'does not store the response for %s as /contact',
    async (requestPath) => {
      expect((await rawGet(requestPath)).body).toContain('files')

      const response = await rawGet('/contact')
      expect(response.body).toContain('PAGE:contact')
    },
  )

  test('does not store API responses requested with an encoded path', async () => {
    const encodedStatsPath = '/%5F_nuxt_multi_cache/stats/route'

    const authorized = await rawGet(encodedStatsPath, { cookie: ADMIN_COOKIE })
    expect(authorized.status).toEqual(200)

    const unauthorized = await rawGet(encodedStatsPath)
    expect(unauthorized.status).toEqual(401)
  })
})
