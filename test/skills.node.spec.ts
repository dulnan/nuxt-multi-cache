import fs from 'node:fs'
import path from 'node:path'
import { parseYAML } from 'confbox'
import { describe, expect, test } from 'vitest'

const ROOT = path.resolve(__dirname, '..')
const SKILLS_DIR = path.join(ROOT, 'skills')
const DOCS_DIR = path.join(ROOT, 'docs')
const DOCS_URL = 'https://nuxt-multi-cache.dulnan.net'

const SKILLS = ['nuxt-multi-cache', 'nuxt-multi-cache-upgrade-v5']

// Fields and limits from https://agentskills.io/specification
const FRONTMATTER_FIELDS = [
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]
const MAX_LINES = 500

function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(dir, file))
    .sort()
}

function parseFrontmatter(content: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content)
  if (!match) {
    throw new Error('No frontmatter found.')
  }
  return parseYAML<Record<string, unknown>>(match[1]!)
}

/**
 * Remove code blocks and inline code, which can contain brackets and
 * parentheses that aren't links.
 */
function stripCode(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '')
}

function getLinks(markdown: string): string[] {
  return [...stripCode(markdown).matchAll(/\]\(([^)\s]+)\)/g)].map(
    (match) => match[1]!,
  )
}

/**
 * Same as the slugify function of VitePress, which creates the heading
 * anchors of the docs.
 */
function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F]/g, '')
      .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/^(\d)/, '_$1')
      .toLowerCase()
  )
}

function getHeadingAnchors(markdown: string): string[] {
  const counts = new Map<string, number>()
  return markdown
    .replace(/^```[\s\S]*?^```/gm, '')
    .split('\n')
    .map((line) => /^#{1,6}\s+(.+)$/.exec(line)?.[1])
    .filter((heading) => heading !== undefined)
    .map((heading) => {
      // Every odd part is inline code, which is kept as it is.
      const text = heading
        .split('`')
        .map((part, i) =>
          i % 2
            ? part
            : part
                .replace(/<[^>]+>/g, '')
                .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
                .replace(/\*/g, ''),
        )
        .join('')
      const slug = slugify(text)
      const count = counts.get(slug) ?? 0
      counts.set(slug, count + 1)
      return count ? `${slug}-${count}` : slug
    })
}

/**
 * Return the error for a link to the docs, if the page or anchor doesn't
 * exist.
 */
function checkDocsLink(url: string): string | undefined {
  const [pathname, anchor] = url.slice(DOCS_URL.length).split('#')
  const candidates = [
    path.join(DOCS_DIR, `${pathname}.md`),
    path.join(DOCS_DIR, pathname || '/', 'index.md'),
  ]
  const file = candidates.find((candidate) => fs.existsSync(candidate))
  if (!file) {
    return `${url}: no docs page`
  }
  if (
    anchor &&
    !getHeadingAnchors(fs.readFileSync(file, 'utf8')).includes(anchor)
  ) {
    return `${url}: no heading with this anchor`
  }
}

describe('The agent skills', () => {
  test('are shipped with the package', () => {
    expect(fs.readdirSync(SKILLS_DIR).sort()).toEqual(SKILLS)

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'),
    )
    expect(packageJson.files).toContain('skills')
  })

  describe.each(SKILLS)('%s', (skill) => {
    const dir = path.join(SKILLS_DIR, skill)
    const readSkill = () => fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8')

    test('has valid frontmatter', () => {
      const frontmatter = parseFrontmatter(readSkill())
      for (const field of Object.keys(frontmatter)) {
        expect(FRONTMATTER_FIELDS).toContain(field)
      }
      expect(frontmatter.name).toEqual(skill)
      expect(skill).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(skill.length).toBeLessThanOrEqual(64)
      expect(frontmatter.description).toBeTypeOf('string')
      const description = frontmatter.description as string
      expect(description.length).toBeGreaterThan(0)
      expect(description.length).toBeLessThanOrEqual(1024)
    })

    test(`has at most ${MAX_LINES} lines`, () => {
      expect(readSkill().split('\n').length).toBeLessThanOrEqual(MAX_LINES)
    })

    test('links to all its reference files, which link no further', () => {
      const links = getLinks(readSkill())
      for (const file of listMarkdownFiles(path.join(dir, 'references'))) {
        const relative = path.relative(dir, file)
        expect(links, `${relative} is not linked`).toContain(relative)
        const nested = getLinks(fs.readFileSync(file, 'utf8')).filter(
          (link) => !/^[a-z]+:/.test(link) && !link.startsWith('#'),
        )
        expect(nested, `${relative} links to local files`).toEqual([])
      }
    })

    test('only has links to existing files and docs pages', () => {
      const errors: string[] = []
      for (const file of listMarkdownFiles(dir)) {
        for (const link of getLinks(fs.readFileSync(file, 'utf8'))) {
          if (link.startsWith(DOCS_URL)) {
            const error = checkDocsLink(link)
            if (error) {
              errors.push(`${path.relative(dir, file)}: ${error}`)
            }
          } else if (!/^[a-z]+:/.test(link) && !link.startsWith('#')) {
            const target = path.resolve(path.dirname(file), link)
            if (!target.startsWith(dir) || !fs.existsSync(target)) {
              errors.push(`${path.relative(dir, file)}: ${link} doesn't exist`)
            }
          }
        }
      }
      expect(errors).toEqual([])
    })
  })
})
