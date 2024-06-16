import { getBrowser, url, waitForHydration } from '@nuxt/test-utils/e2e'
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

export async function createPageWithConsoleMessages(
  targetUrl: string,
  language: string,
): Promise<{ page: Page; messages: string[] }> {
  const pageUrl = url(targetUrl)
  const messages: string[] = []
  const browser = await getBrowser()
  const page = await browser.newPage({
    extraHTTPHeaders: {
      'accept-language': language,
    },
  })
  const msgPromise = page.waitForEvent('console')
  page.on('console', (msg) => {
    messages.push(msg.text())
  })
  await page.goto(pageUrl)
  await waitForHydration(page, pageUrl)
  await msgPromise
  return { page, messages }
}
