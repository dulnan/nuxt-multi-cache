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
    console.log('dest: ' + dest)
    if (dest === '/') {
      dest = 'index.html'
    } else {
      dest += '.html'
    }
    console.log('dest: ' + dest)

    const destDir = path.join(this.folderPages, path.dirname(dest))
    console.log('destDir: ' + destDir)
    return makeDir(destDir).then(() => {
      const filePath = path.join(this.folderPages, dest)
      console.log('filePath: ' + filePath)
      return fs.promises.writeFile(filePath, markup).then(() => {
        console.log('written!!!!')
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

  purgeAll() {
    return fs.promises.rmdir(this.folderPages, { recursive: true })
  }
}
