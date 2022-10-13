import path from 'path'
import { Cache } from './../'
import { LowSync, MemorySync, JSONFileSync } from 'lowdb'
import makeDir from 'make-dir'
import { MultiCacheConfig } from './../../config'

export interface GroupsCacheEntry {
  name: string
  tags: string[]
}

interface DBGroupsCache {
  groups: GroupsCacheEntry[]
}

export default class GroupsCache implements Cache {
  db: LowSync<DBGroupsCache>

  constructor(
    _config: MultiCacheConfig['groupsCache'],
    outputDir?: string,
    persisting = false
  ) {
    if (persisting) {
      if (!outputDir) {
        throw new Error('Missing outputDir for GroupsCache.')
      }
      const dirPath = path.resolve(outputDir, 'data')
      const filePath = path.resolve(outputDir, 'data', 'groups.json')
      makeDir.sync(dirPath)
      const adapter = new JSONFileSync<DBGroupsCache>(filePath)

      this.db = new LowSync<DBGroupsCache>(adapter)
    } else {
      this.db = new LowSync<DBGroupsCache>(new MemorySync<DBGroupsCache>())
    }
    if (!this.db.data) {
      this.db.data = { groups: [] }
    }
  }

  get(name: string) {
    const group = this.db.data?.groups.find((v) => v.name === name)
    return Promise.resolve(group)
  }

  set(name: string, _data: any, tags: string[] = []) {
    this.db.data?.groups.filter((v) => v.name)
    this.db.data?.groups.push({ name, tags })
    this.db.write()
    return Promise.resolve(true)
  }

  has(name: string): Promise<boolean> {
    return Promise.resolve(!!this.db.data?.groups.find((v) => v.name === name))
  }

  purgeTags(tags: string[] = []) {
    const removedKeys: string[] = []
    this.db.data?.groups.forEach((entry) => {
      const match = entry.tags.some((v) => tags.includes(v))
      if (match) {
        removedKeys.push(entry.name)
        this.db.data?.groups.filter((v) => v.name !== entry.name)
      }
    })

    return Promise.resolve({ purged: removedKeys.length, success: true })
  }

  getTags() {
    const tags: Record<string, number> = {}
    this.db.data?.groups.forEach((group) => {
      group.tags.forEach((tag) => {
        if (!tags[tag]) {
          tags[tag] = 0
        }
        tags[tag]++
      })
    })

    return Promise.resolve(
      Object.keys(tags).map((tag) => {
        return { tag, count: tags[tag] }
      })
    )
  }

  purgeKeys(names: string[]) {
    names.forEach((name) => {
      this.db.data?.groups.filter((v) => v.name !== name)
    })

    return Promise.resolve({ purged: names.length, success: true })
  }

  getAllPurgableTags(tags: string[]) {
    const allTags: string[] = [...tags]

    this.db.data?.groups.forEach((group) => {
      const match = group.tags.some((v) => tags.includes(v))
      if (match) {
        allTags.push(group.name)
      }
    })

    return allTags
  }

  getEntries(_offset = 0) {
    const rows = this.db.data?.groups || []

    return Promise.resolve({ total: rows.length, rows })
  }

  getCountForTag(tag: string) {
    let count = 0
    this.db.data?.groups.forEach((entry) => {
      const match = entry.tags.includes(tag)
      if (match) {
        count++
      }
    })
    return Promise.resolve(count)
  }

  purgeAll() {
    const purged = this.db.data?.groups.length
    this.db.data = { groups: [] }
    return Promise.resolve({ purged, success: true })
  }
}
