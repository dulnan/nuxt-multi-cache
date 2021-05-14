import path from 'path'
import { Cache } from './../'
import low, { LowdbSync } from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

export interface GroupsCacheEntry {
  name: string
  tags: string[]
}

interface DBGroupsCache {
  groups: GroupsCacheEntry[]
}

export interface GroupsCacheConfig {
  enabled: boolean
}

export default class GroupsCache implements Cache {
  db: LowdbSync<DBGroupsCache>

  constructor(config: GroupsCacheConfig, outputDir?: string) {
    if (!outputDir) {
      throw new Error('Missing outputDir for GroupsCache.')
    }
    const filePath = path.resolve(outputDir, 'data', 'groups.json')
    const adapter = new FileSync(filePath)

    this.db = low(adapter)
    this.db.defaults({ groups: [] }).write()
  }

  get(name: string) {
    const group = this.db.get('groups').find({ name }).value()
    return Promise.resolve(group)
  }

  set(name: string, _data: any, tags: string[] = []) {
    this.db.get('groups').remove({ name }).write()
    this.db.get('groups').push({ name, tags }).write()
    return Promise.resolve(true)
  }

  has(name: string): Promise<boolean> {
    return Promise.resolve(!!this.db.get('groups').find({ name }).value)
  }

  purgeTags(tags: string[] = []) {
    const removedKeys: string[] = []
    this.db.get('groups').forEach((entry) => {
      const match = entry.tags.some((v) => tags.includes(v))
      if (match) {
        removedKeys.push(entry.name)
        this.db.get('groups').remove(entry)
      }
    })

    return Promise.resolve({ purged: removedKeys.length, success: true })
  }

  purgeKeys(names: string[]) {
    names.forEach((name) => {
      this.db.get('groups').remove({ name })
    })

    return Promise.resolve({ purged: names.length, success: true })
  }

  getAllPurgableTags(tags: string[]) {
    const allTags: string[] = [...tags]

    this.db.get('groups').forEach(group => {
      const match = group.tags.some((v) => tags.includes(v))
      if (match) {
        allTags.push(group.name)
      }
    })

    return allTags
  }

  getEntries(_offset = 0) {
    const rows = this.db.get('groups').value()

    return Promise.resolve({ total: rows.length, rows })
  }

  getCountForTag(tag: string) {
    let count = 0
    this.db.get('groups').forEach((entry) => {
      const match = entry.tags.includes(tag)
      if (match) {
        count++
      }
    })
    return Promise.resolve(count)
  }

  purgeAll() {
    const purged = this.db.get('groups').toLength().value()
    this.db.get('groups').remove().write()
    return Promise.resolve({ purged, success: true })
  }
}
