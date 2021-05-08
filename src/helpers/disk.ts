import fs from 'fs'
import path from 'path'
import makeDir from 'make-dir'
import { normalizeURL, joinURL, withoutTrailingSlash } from 'ufo'

export default class Disk {
  folder: string
  folderPages: string
  folderData: string

  constructor(folder: string) {
    this.folder = folder
    this.folderPages = path.join(folder, 'pages')
    this.folderData = path.join(folder, 'data')
  }

  write(route: string, markup: string): Promise<string> {
    let dest = withoutTrailingSlash(normalizeURL(route))
    if (dest === '/') {
      dest = 'index.html'
    } else {
      dest += '.html'
    }

    const destDir = path.join(this.folderPages, path.dirname(dest))
    return makeDir(destDir).then(() => {
      const filePath = path.join(this.folderPages, dest)
      return fs.promises.writeFile(filePath, markup).then(() => {
        return dest
      })
    })
  }

  getDatabaseFolder() {
    return this.folderData
  }

  initFolders() {
    return Promise.all([
      this.folder, this.folderPages, this.folderData
    ].map(v => makeDir(v)))
  }

  /**
   * Purge all files in the page cache directory.
   */
  purgeAll() {
    return fs.promises.rmdir(this.folderPages, { recursive: true })
  }

  /**
   * Check if the file under the given path exists.
   */
  fileExists(fullPath: string): Promise<boolean> {
    return fs.promises.access(fullPath).then(() => true).catch(() => false)
  }

  /**
   * Remove the file.
   */
  remove(filePath = ''): Promise<boolean> {
    if (!filePath) {
      return Promise.resolve(false)
    }
    const dest = path.join(this.folderPages, filePath)
    return this.fileExists(dest)
      .then((exists) => {
        if (exists) {
          return fs.promises.unlink(dest)
        }
      })
      .then(() => true)
      .catch(() => false)
  }
}
