import { getBrowser, url } from '@nuxt/test-utils/e2e'
import type { Page } from 'playwright-core'

export function sleep(delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, delay)
  })
}

export async function createPageWithoutHydration(
  targetUrl: string,
  language: string,
): Promise<Page> {
  const browser = await getBrowser()
  const page = await browser.newPage({
    javaScriptEnabled: false,
    extraHTTPHeaders: {
      'accept-language': language,
    },
  })
  await page.goto(url(targetUrl))
  return page
}
