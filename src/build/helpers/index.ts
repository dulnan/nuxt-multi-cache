import { existsSync } from 'node:fs'

export const fileExists = (
  path?: string,
  extensions = ['js', 'ts', 'mts'],
): string | null => {
  if (!path) {
    return null
  } else if (existsSync(path)) {
    // If path already contains/forces the extension.
    return path
  }

  const extension = extensions.find((extension) =>
    existsSync(`${path}.${extension}`),
  )

  return extension ? `${path}.${extension}` : null
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
