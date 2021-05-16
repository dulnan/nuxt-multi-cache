import path from 'path'
import Disk from './disk'
import sqlite3 from 'sqlite3'
import { PREPARE } from './db'
import { Cache } from './../..'
import { CacheConfigPage, GetCacheKeyMethod, getCacheKey } from './..'

interface RouteCacheQueueEntry {
  tag: string
  route: string
}

/**
 * Page cache.
 *
 * Routes are cached by their route name (path) and optionally by tags.
 * It's possible to purge a single route or purge all routes containing certain
 * tags.
 *
 * Routes are saved to disk, so that they can directly be served by a web
 * server.
 */
export default class PageCacheDisk implements Cache {
  disk: Disk

  /**
   * The map where the cached routes are stored.
   */
  db: sqlite3.Database

  /**
   * DB statements.
   */
  dbRoutesTotal: sqlite3.Statement
  dbRoutesRows: sqlite3.Statement
  dbTagsRows: sqlite3.Statement
  dbTagsTotal: sqlite3.Statement
  dbRemoveRoute: sqlite3.Statement
  dbCountForTag: sqlite3.Statement
  insertQueue: RouteCacheQueueEntry[]

  /**
   * Method to determine the cache key for a route.
   */
  getCacheKey: GetCacheKeyMethod

  constructor(config: CacheConfigPage, outputDir = '') {
    this.disk = new Disk(outputDir)
    this.disk.initFolders()

    this.getCacheKey = config.getCacheKey || getCacheKey

    this.db = new sqlite3.Database(
      path.resolve(this.disk.getDatabaseFolder(), 'data.db')
    )

    this.insertQueue = []
    this.initDatabase()

    this.dbTagsRows = this.db.prepare(
      'SELECT tag, COUNT(tag) as count FROM page_cache GROUP BY tag ORDER BY count DESC'
    )
    this.dbTagsTotal = this.db.prepare(
      'SELECT COUNT(DISTINCT tag) as total FROM page_cache'
    )
    this.dbRoutesRows = this.db.prepare(
      'SELECT COUNT(tag) as count, route FROM page_cache GROUP BY route ORDER BY count DESC LIMIT 100 OFFSET ?'
    )
    this.dbRoutesTotal = this.db.prepare(
      'SELECT COUNT(DISTINCT route) as total FROM page_cache'
    )
    this.dbRemoveRoute = this.db.prepare(
      'DELETE FROM page_cache WHERE route = ?'
    )
    this.dbCountForTag = this.db.prepare(
      'SELECT COUNT(DISTINCT route) as total FROM page_cache WHERE tag = ?'
    )

    setInterval(() => {
      this.performWrite()
    }, 5000)
  }

  initDatabase() {
    this.db.exec(PREPARE)
  }

  performWrite(): Promise<void> {
    return new Promise((resolve) => {
      const statement = this.db.prepare(
        'INSERT or IGNORE INTO page_cache (tag, route) VALUES (?, ?)'
      )
      while (this.insertQueue.length > 0) {
        const { tag, route } = this.insertQueue.pop() as RouteCacheQueueEntry
        statement.run(tag, route)
      }
      statement.finalize(() => {
        resolve()
      })
    })
  }

  get(_key: string) {
    return Promise.resolve(false)
  }

  /**
   * Add a route to the cache.
   */
  set(route: string, data: any, tags: string[] = []): Promise<boolean> {
    return this.disk
      .write(route, data.html)
      .then(() => {
        return this.insert(route, tags)
      })
      .then(() => {
        return true
      })
      .catch((e) => {
        console.log(e)
        return false
      })
  }

  has(_key: string) {
    return Promise.resolve(false)
  }

  /**
   * Insert tags in to the database.
   */
  insert(route: string, tags: string[]) {
    for (const tag of tags) {
      this.insertQueue.push({ tag, route })
    }
  }

  /**
   * Purge by tags.
   */
  async purgeTags(tags: string[] = []): Promise<any> {
    const condition = tags.map((v) => `'${v}'`).join(',')
    const querySelect = `SELECT DISTINCT route FROM page_cache WHERE tag IN (${condition})`
    const select = this.db.prepare(querySelect)
    const routes = await this.dbGetAll(select).then((v) =>
      v.map((v) => v.route)
    )

    await Promise.all(routes.map((route) => this.disk.remove(route)))

    const remove = this.db.prepare(
      `DELETE FROM page_cache WHERE route IN (${querySelect})`
    )
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
  async getEntries(offset = 0) {
    const total = await this.dbGet(this.dbRoutesTotal).then((v) => v.total)
    const rows = await this.dbGetAll(this.dbRoutesRows, [offset])

    return { total, rows }
  }

  getCountForTag(tag: string) {
    return this.dbGet(this.dbCountForTag, [tag]).then(v => v.total)
  }

  dbGetAll(
    query: sqlite3.Statement,
    params?: any[]
  ): Promise<Record<string, any>[]> {
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

  dbGet(
    query: sqlite3.Statement,
    params?: any[]
  ): Promise<Record<string, any>> {
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

  /**
   * Get a list of tags and their usage count.
   */
  async getTags() {
    try {
      const rows = await this.dbGetAll(this.dbTagsRows)
      return rows
    } catch (e) {
      console.log(e)
      return []
    }
  }

  /**
   * Purge URLs.
   */
  purgeKeys(keys: string[]) {
    keys.forEach((key) => {
      this.disk.remove(key)
      this.dbRemoveRoute.run(key)
    })
    return Promise.resolve({ success: true })
  }

  /**
   * Purge everything from disk and the database.
   */
  purgeAll() {
    return this.disk.purgeAll().then(() => {
      this.db.exec('DELETE FROM page_cache')
    }).then(() => {
      return { success: true }
    }).catch(() => {
      return { success: false }
    })
  }
}
