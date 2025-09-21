import { describe, it, expect } from 'vitest'
import path from 'path'
import { glob } from 'glob'
import fs from 'fs'

type ClientBundle = {
  filePath: string
  contents: string
}

/**
 * The strings to check.
 */
const STRINGS = [
  // Must not be included because the build plugin overrides the entire file exporting these.
  'consola',
  'serverOptions',

  // Should never be in the client bundle because it's noop on the client.
  'useCDNHeaders',
  'useRouteCache',
  'bubbleCacheability(',

  // Random strings that only appear in server code.
  'Failed to get component cache item',
  'Failed to get SSR context',
  'No H3Event provided',
]

/**
 * Test that none of the defined strings appears in any of the generated client
 * bundles.
 */
describe('Client bundles', async () => {
  const folderPath = path.join(
    __dirname,
    '../../playground/.output/public/_nuxt',
  )

  const files = await glob(folderPath + '/**/*.js')

  const clientBundles: ClientBundle[] = await Promise.all(
    files.map(async (filePath) => {
      const buffer = await fs.promises.readFile(filePath)
      return {
        filePath,
        contents: buffer.toString(),
      }
    }),
  )

  // Make sure we are acually testing client bundles.
  it('are generated before the test is run', () => {
    expect(
      files,
      'this test must run after the playground build',
    ).length.to.be.above(1)
  })

  STRINGS.forEach((string) => {
    it(`do not contain the string "${string}"`, () => {
      clientBundles.forEach((file) => {
        const containsString = file.contents.includes(string)
        expect(
          containsString,
          `File "${path.basename(file.filePath)}" contains "${string}"`,
        ).toBe(false)
      })
    })
  })
})
