import fs from 'fs'
import path from 'path'
import makeDir from 'make-dir'
import { normalizeURL, withoutTrailingSlash } from 'ufo'

export default class Disk {
  folder: string
  folderPages: string
  folderData: string

  constructor(folder: string) {
    this.folder = folder
    this.folderPages = path.join(folder, 'pages')
    this.folderData = path.join(folder, 'data')
  }

  mapUrlToFilePath(url = ''): string {
    let dest = withoutTrailingSlash(normalizeURL(url))
    if (dest === '/') {
      dest = 'index.html'
    } else {
      dest += '.html'
    }

    return path.join(this.folderPages, dest)
  }

  write(route: string, markup: string): Promise<string> {
    const filePath = this.mapUrlToFilePath(route)
    const destDir = path.dirname(filePath)

    return makeDir(destDir).then(() => {
      return fs.promises.writeFile(filePath, markup).then(() => {
        return filePath
      })
    })
  }

  getDatabaseFolder() {
    return this.folderData
  }

  initFolders() {
    return Promise.all(
      [this.folder, this.folderPages, this.folderData].map((v) => makeDir(v))
    )
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
    return fs.promises
      .access(fullPath)
      .then(() => true)
      .catch(() => false)
  }

  /**
   * Remove the file.
   */
  remove(route = ''): Promise<boolean> {
    const filePath = this.mapUrlToFilePath(route)
    return this.fileExists(filePath)
      .then((exists) => {
        if (exists) {
          return fs.promises.unlink(filePath)
        }
      })
      .then(() => true)
      .catch(() => false)
  }
}
