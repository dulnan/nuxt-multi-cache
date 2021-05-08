import { CacheConfig } from "."
import path from 'path'
import Disk from "./helpers/disk"
import SQLite, {Statement} from 'better-sqlite3'
import sqlite3 from 'sqlite3'
import { PREPARE } from './DB'
import ComponentCache from "./ComponentCache"

interface RouteCacheQueueEntry {
  tag: string
  route: string
}

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
  db: sqlite3.Database

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
   * Map of existing global tags.
   */
  globalTagMap: Map<string, number>

  componentCache: ComponentCache

  /**
   * DB statements.
   */
  dbSpaceGet: sqlite3.Statement
  dbSpaceCreate: sqlite3.Statement
  dbTagGet: sqlite3.Statement
  dbTagCreate: sqlite3.Statement
  dbRouteGet: sqlite3.Statement
  dbRouteCreate: sqlite3.Statement
  dbCacheInsert: sqlite3.Statement
  dbRouteQueryRows: sqlite3.Statement
  dbRouteQueryTotal: sqlite3.Statement
  dbRouteQuerySearchRows: sqlite3.Statement
  dbRouteQuerySearchTotal: sqlite3.Statement
  dbRouteById: sqlite3.Statement
  dbCacheRemove: sqlite3.Statement
  dbRouteUpdate: sqlite3.Statement
  dbTagsRows: sqlite3.Statement
  dbTagsTotal: sqlite3.Statement

  insertQueue: RouteCacheQueueEntry[]

  constructor(config: CacheConfig, componentCache: ComponentCache) {
    this.componentCache = componentCache
    this.disk = new Disk(config.filesystem?.folder as string)
    this.disk.initFolders()

    this.db = new sqlite3.Database(path.resolve(this.disk.getDatabaseFolder(), 'data.db'))
    this.routeMap = new Map()
    this.spaceMap = new Map()
    this.tagMap = new Map()
    this.globalTagMap = new Map()

    this.insertQueue = []

    this.initDatabase()
    this.dbSpaceGet = this.db.prepare('SELECT sid FROM spaces WHERE space = ?')
    this.dbSpaceCreate = this.db.prepare('INSERT or IGNORE INTO spaces (space) VALUES (?)')
    this.dbTagGet = this.db.prepare('SELECT tid FROM tags WHERE tag = ?')
    this.dbTagCreate = this.db.prepare('INSERT or IGNORE INTO tags (tag) VALUES (?)')
    this.dbRouteGet = this.db.prepare('SELECT rid FROM routes WHERE route = ?')
    this.dbRouteCreate = this.db.prepare('INSERT or IGNORE INTO routes (route, path) VALUES (?, ?)')
    this.dbCacheInsert = this.db.prepare('INSERT or IGNORE INTO cache (sid, tid, rid) VALUES (?, ?, ?)')

    this.dbRouteQueryRows = this.db.prepare('SELECT * FROM routes LIMIT 100 OFFSET ?')
    this.dbRouteQueryTotal = this.db.prepare('SELECT COUNT() as count FROM routes')

    this.dbRouteQuerySearchRows = this.db.prepare('SELECT routes.rid, routes.route, routes.path, routes.timestamp FROM routes INNER JOIN cache c on routes.rid = c.rid WHERE c.tid = ? LIMIT 100 OFFSET ?')
    this.dbRouteQuerySearchTotal = this.db.prepare('SELECT COUNT(routes.rid) as count FROM routes INNER JOIN cache c on routes.rid = c.rid WHERE c.tid = ?')

    this.dbRouteById = this.db.prepare('SELECT * FROM routes WHERE rid = ?')
    this.dbCacheRemove = this.db.prepare('DELETE FROM cache WHERE rid = ?')
    this.dbRouteUpdate = this.db.prepare('UPDATE routes SET timestamp = CURRENT_TIMESTAMP, path = ? WHERE ? = rid')

    this.dbTagsRows = this.db.prepare('SELECT tag, COUNT(*) as "count" FROM tags INNER JOIN cache c on tags.tid = c.tid GROUP BY c.tid ORDER BY count DESC LIMIT 48 OFFSET ?')
    this.dbTagsTotal = this.db.prepare('SELECT COUNT() as count FROM tags')


    setInterval(() => {
      this.performWrite()
    }, 5000)
  }

  initDatabase() {
    this.db.exec(PREPARE)
  }

  performWrite(): Promise<void> {
    return new Promise((resolve) => {
      const statement = this.db.prepare('INSERT or IGNORE INTO page_cache (tag, route) VALUES (?, ?)')
      while (this.insertQueue.length > 0) {
        const { tag, route } = this.insertQueue.pop() as RouteCacheQueueEntry
        statement.run(tag, route)
      }
      statement.finalize(() => {
        resolve()
      })
    })
  }

  /**
   * Add a route to the cache.
   */
  set(route: string, tags: string[] = [], globalTags: string[] = [], data: string): Promise<boolean> {
    return this.disk.write(route, data).then(filePath => {
      return this.insert(route, filePath, tags, globalTags)
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
  insert(route: string, filePath: string, tags: string[], globalTags: string[]) {
    for (const tag of tags) {
      this.insertQueue.push({ tag, route })
    }
  }

  /**
   * Get route ID.
   */
  getRouteId(route: string, filePath: string): number {
    if (this.routeMap.has(route)) {
      return this.routeMap.get(route) as number
    }
    let { rid } = this.dbRouteGet.get(route) || {}

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
  getTagId(tag: string, create = false): number|null {
    if (this.tagMap.has(tag)) {
      return this.tagMap.get(tag) as number
    }
    let { tid } = this.dbTagGet.get(tag) || {}

    // Create the tag if 
    if (!tid && create) {
      const result = this.dbTagCreate.run(tag)
      tid = result.lastInsertRowid
    }

    if (tid) {
      this.tagMap.set(tag, tid)
    }

    return tid || null
  }

  /**
   * Get space ID.
   */
  getSpaceId(space: string): number {
    if (this.spaceMap.has(space)) {
      return this.spaceMap.get(space) as number
    }
    let { sid } = this.dbSpaceGet.get(space) || {}

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
  purgeTags(tags: string[] = []): Promise<boolean> {
    // Map the tags to their IDs and filter any tags not currently used.
    const tids = tags.map(tag => {
      return this.getTagId(tag)
    }).filter(Boolean)

    // We can safely concat our query because we only have IDs in our tids
    // array.

    // Create the statement.
    const querySelect = this.db.prepare(`SELECT DISTINCT path, cache.rid FROM cache INNER JOIN routes r on r.rid = cache.rid WHERE tid IN (${tids.join(',')})`)
    // Get a list of all paths.
    const rows = querySelect.all()

    return Promise.all(rows.map(row => {
      return this.disk.remove(row.path)
    })).then(() => {
      const queryDelete = `
        UPDATE routes SET timestamp = CURRENT_TIMESTAMP, path = '' WHERE rid IN (SELECT DISTINCT rid FROM cache WHERE tid IN (${tids.join(',')}));
        DELETE FROM cache WHERE rid IN (SELECT DISTINCT rid FROM cache WHERE tid IN (${tids.join(',')}));
      `
      this.db.exec(queryDelete)
      return true
    }).catch((e) => {
      console.log(e)
      return false
    })
  }

  /**
   * Get routes that should be purged.
   */
  getRoutesToPurge(tags: string[] = []): string[] {
    return []
  }

  /**
   * Get a list of routes.
   */
  getRoutes(offset = 0, tag = '') {
    if (tag) {
      const tid = this.getTagId(tag)
      const total = this.dbRouteQuerySearchTotal.get([tid])
      console.log(total)
      const rows = this.dbRouteQuerySearchRows.all([tid, offset])
      return { total: total.count, rows }
    }

    const total = this.dbRouteQueryTotal.get().count
    const rows = this.dbRouteQueryRows.all([offset])
    return { total, rows }
  }

  /**
   * Get a list of tags and their usage count.
   */
  getTags(offset = 0) {
    const total = this.dbTagsTotal.get().count
    const rows = this.dbTagsRows.all([offset])
    return { total, rows}
  }

  /**
   * Purge a single route.
   */
  purgeRoute(rid: number) {
    const route = this.dbRouteById.get(rid)
    if (!route) {
      console.log('Failed to purge route id:' + rid)
      return Promise.reject('Route does not exist')
    }

    return this.disk.remove(route.path).then(success => {
      return this.dbCacheRemove.run(rid)
    }).then(() => {
      return this.dbRouteUpdate.run(null, rid)
    }).then(() => {
      return route
    })
  }

  /**
   * Purge URLs.
   */
  purgeUrls(_urls: string[]) {
    return Promise.resolve(true)
    // const route = this.dbRouteById.get(rid)
    // console.log('::purgeRoute', route)
    // if (!route) {
    //   console.log('Failed to purge route id:' + rid)
    //   return Promise.reject('Route does not exist')
    // }
    //
    // return this.disk.remove(route.path).then(success => {
    //   return this.dbCacheRemove.run(rid)
    // }).then(() => {
    //   return this.dbRouteUpdate.run(null, rid)
    // }).then(() => {
    //   return route
    // })
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
