import { CacheConfig } from "."
import path from 'path'
import Disk from "./helpers/disk"
import SQLite, {Statement} from 'better-sqlite3'
import { PREPARE } from './DB'

/**
 * In-memory cache.
 *
 * Routes are cached by their route name (path) and optionally by tags.
 * It's possible to purge a single route or purge all routes containing certain
 * tags.
 */
export default class Cache {
  disk: Disk
  /**
   * The map where the cached routes are stored.
   */
  db: SQLite.Database

  /**
   * Map of existing routes.
   */
  routeMap: Map<string, number>

  /**
   * Map of existing spaces.
   */
  spaceMap: Map<string, number>

  /**
   * Map of existing tags.
   */
  tagMap: Map<string, number>

  /**
   * DB statements.
   */
  dbSpaceGet: Statement
  dbSpaceCreate: Statement
  dbTagGet: Statement
  dbTagCreate: Statement
  dbRouteGet: Statement
  dbRouteCreate: Statement
  dbCacheInsert: Statement

  constructor(config: CacheConfig) {
    this.disk = new Disk(config.filesystem?.folder as string)
    this.disk.initFolders()

    this.db = new SQLite(path.resolve(this.disk.getDatabaseFolder(), 'data.db'))
    this.routeMap = new Map()
    this.spaceMap = new Map()
    this.tagMap = new Map()

    this.initDatabase()
    this.dbSpaceGet = this.db.prepare('SELECT sid FROM spaces WHERE space = ?')
    this.dbSpaceCreate = this.db.prepare('INSERT or IGNORE INTO spaces (space) VALUES (?)')
    this.dbTagGet = this.db.prepare('SELECT tid FROM tags WHERE tag = ?')
    this.dbTagCreate = this.db.prepare('INSERT or IGNORE INTO tags (tag) VALUES (?)')
    this.dbRouteGet = this.db.prepare('SELECT rid FROM routes WHERE route = ?')
    this.dbRouteCreate = this.db.prepare('INSERT or IGNORE INTO routes (route, path) VALUES (?, ?)')
    this.dbCacheInsert = this.db.prepare('INSERT or IGNORE INTO cache (sid, tid, rid) VALUES (?, ?, ?)')
  }

  initDatabase() {
    this.db.exec(PREPARE)
  }

  /**
   * Add a route to the cache.
   */
  set(route: string, tags: string[] = [], data: string): Promise<boolean> {
    return this.disk.write(route, data).then(filePath => {
      return this.insert(route, filePath, tags)
    }).then(() => {
      return true
    }).catch((e) => {
      console.log(e)
      return false
    })
  }

  /**
   * Insert tags in to the database.
   */
  insert(route: string, filePath: string, tags: string[] = []) {
    const rid = this.getRouteId(route, filePath)

    for (const tag of tags) {
      const i = tag.indexOf(':')
      const space = i !== -1 ? tag.substring(0, i) : tag
      if (space) {
        const sid = this.getSpaceId(space)
        const tid = this.getTagId(tag)
        if (tid && sid) {
          try {
            this.dbCacheInsert.run(sid, tid, rid)
          } catch (e) {
            console.log(e)
          }
        }
      } else {
        console.log('Invalid cache tag: ' + tag)
      }
    }
  }

  /**
   * Get route ID.
   */
  getRouteId(route: string, filePath: string): number {
    if (this.routeMap.has(route)) {
      return this.routeMap.get(route) as number
    }
    let rid = this.dbRouteGet.get(route)

    if (!rid) {
      const result = this.dbRouteCreate.run(route, filePath)
      if (result.changes > 0) {
        rid = result.lastInsertRowid
      }
    }

    this.routeMap.set(route, rid)

    return rid
  }

  /**
   * Get space ID.
   */
  getTagId(tag: string): number {
    if (this.tagMap.has(tag)) {
      return this.tagMap.get(tag) as number
    }
    let tid = this.dbTagGet.get(tag)

    if (!tid) {
      const result = this.dbTagCreate.run(tag)
      tid = result.lastInsertRowid
    }

    this.tagMap.set(tag, tid)

    return tid
  }

  /**
   * Get space ID.
   */
  getSpaceId(space: string): number {
    if (this.spaceMap.has(space)) {
      return this.spaceMap.get(space) as number
    }
    let sid = this.dbSpaceGet.get(space)

    if (!sid) {
      const result = this.dbSpaceCreate.run(space)
      sid = result.lastInsertRowid
    }

    this.spaceMap.set(space, sid)

    return sid
  }

  /**
   * Purge by tags.
   */
  purgeTags(tags: string[] = []): Promise<boolean | Error> {
    return Promise.resolve(true)
  }

  /**
   * Get routes that should be purged.
   */
  getRoutesToPurge(tags: string[] = []): string[] {
    return []
  }

  getCachedRoutes(offset = 0) {
    const routes = this.db.exec('')
  }

  /**
   * Purge everything from disk and the database.
   */
  purgeAll(): Promise<any> {
    return this.disk.purgeAll().then(() => {
      return this.db.exec('DELETE FROM files')
    })
  }
}
