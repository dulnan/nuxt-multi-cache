import { CacheConfig } from "."
import path from 'path'
import Disk from "./helpers/disk"
import sqlite3 from 'sqlite3'
import { PREPARE } from './DB'
import ComponentCache from "./ComponentCache"

function onlyUnique(item: any, pos: number, self: any) {
  return self.indexOf(item) == pos;
}

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
  dbRoutesTotal: sqlite3.Statement
  dbRoutesRows: sqlite3.Statement
  dbTagsRows: sqlite3.Statement
  dbTagsTotal: sqlite3.Statement
  dbRemoveRoute: sqlite3.Statement
  dbGetGetCacheGroup: sqlite3.Statement
  dbGetCacheGroups: sqlite3.Statement

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

    this.dbTagsRows = this.db.prepare('SELECT tag, COUNT(tag) as count FROM page_cache GROUP BY tag ORDER BY count DESC LIMIT 100 OFFSET ?')
    this.dbTagsTotal = this.db.prepare('SELECT COUNT(DISTINCT tag) as total FROM page_cache')

    this.dbRoutesRows = this.db.prepare('SELECT COUNT(tag) as count, route FROM page_cache GROUP BY route ORDER BY count DESC LIMIT 100 OFFSET ?')
    this.dbRoutesTotal = this.db.prepare('SELECT COUNT(DISTINCT route) as total FROM page_cache')

    this.dbRemoveRoute = this.db.prepare('DELETE FROM page_cache WHERE route = ?')
    this.dbGetGetCacheGroup = this.db.prepare('SELECT name FROM cache_groups WHERE tag = ?')
    this.dbGetCacheGroups = this.db.prepare('SELECT name, tag FROM cache_groups')

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
  set(route: string, tags: string[] = [], data: string): Promise<boolean> {
    return this.disk.write(route, data).then(() => {
      return this.insert(route, tags)
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
  insert(route: string, tags: string[]) {
    for (const tag of tags) {
      this.insertQueue.push({ tag, route })
    }
  }

  addCacheGroup(name: string, tags: string[] = []): Promise<void> {
    return new Promise((resolve) => {
      const statement = this.db.prepare('INSERT or IGNORE INTO cache_groups (name, tag) VALUES (?, ?)')
      const queue: string[] = [...tags]
      while (queue.length > 0) {
        const tag = queue.pop()
        statement.run(name, tag)
      }
      statement.finalize(() => {
        resolve()
      })
    })
  }

  getAllPurgableTags(tags: string[]) {
    return Promise.all(
      tags.map((tag) =>
        this.dbGetAll(this.dbGetGetCacheGroup, [tag]).then((v) => {
          return [...v.map((e) => e.name), tag]
        })
      )
    ).then(v => v.flat().filter(onlyUnique))
  }

  /**
   * Purge by tags.
   */
  async purgeTags(tags: string[] = []): Promise<any> {
    const condition = tags.map(v => `'${v}'`).join(',')
    const querySelect = `SELECT DISTINCT route FROM page_cache WHERE tag IN (${condition})`
    const select = this.db.prepare(querySelect)
    const routes = await this.dbGetAll(select).then(v => v.map(v => v.route))

    await Promise.all(routes.map(route => this.disk.remove(route)))

    const remove = this.db.prepare(`DELETE FROM page_cache WHERE route IN (${querySelect})`)
    remove.run()

    return Promise.resolve({ total: routes.length })
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
  async getRoutes(offset = 0) {
    try {
      const total = await this.dbGet(this.dbRoutesTotal).then(v => v.total)
      const rows = await this.dbGetAll(this.dbRoutesRows, [offset])

      return { total, rows }
    } catch(e) {
      console.log(e)
    }
  }

  dbGetAll(query: sqlite3.Statement, params?: any[]): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      query.all(params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  dbGet(query: sqlite3.Statement, params?: any[]): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      query.get(params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  getCacheGroups() {
    return this.dbGetAll(this.dbGetCacheGroups).then(rows => {
      const map = rows.reduce<Record<string, string[]>>((acc, row) => {
        if (!acc[row.name]) {
          acc[row.name] = []
        }
        acc[row.name].push(row.tag)
        return acc
      }, {})

      const result = Object.keys(map).map(name => {
        return {
          name,
          tags: map[name]
        }
      })

      return { total: result.length, rows: result }
    })
  }

  /**
   * Get a list of tags and their usage count.
   */
  async getTags(offset = 0) {
    try {
      const total = await this.dbGet(this.dbTagsTotal).then(v => v.total)
      const rows = await this.dbGetAll(this.dbTagsRows, [offset])

    return { total, rows }
    } catch(e) {
      console.log(e)
      return { total: 0, rows: [] }
    }
  }

  /**
   * Purge URLs.
   */
  purgeUrls(urls: string[]) {
    urls.forEach((url) => {
      this.disk.remove(url)
      this.dbRemoveRoute.run(url)
    })
    return Promise.resolve(true)
  }

  /**
   * Purge everything from disk and the database.
   */
  purgeAll(): Promise<any> {
    return this.disk.purgeAll().then(() => {
      this.db.exec('DELETE FROM page_cache')
      this.db.exec('DELETE FROM cache_groups')
    })
  }
}
