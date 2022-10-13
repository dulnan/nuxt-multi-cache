import express, { NextFunction, Request, Response } from 'express'
import { PageCacheDisk, PageCacheMemory } from './../Cache/Page'
import ComponentCache from './../Cache/Component'
import DataCache from './../Cache/Data'
import { Cache } from './../Cache'
import basicAuth from 'basic-auth'
import GroupsCache from './../Cache/Groups'

export type ServerAuthMethod = (req: Request) => boolean
export interface ServerAuthCredentials {
  username: string
  password: string
}

function getDefaultPurgeAuthCheck(
  config: ServerAuthCredentials
): ServerAuthMethod {
  return function (req: Request): boolean {
    const auth = basicAuth(req)
    if (auth) {
      return auth.name === config.username && auth.pass === config.password
    }

    return false
  }
}

function logger(message: any) {
  console.log('serverMiddleware: ', message)
}

export default function createServerMiddleware(
  pageCache: PageCacheMemory | PageCacheDisk | null,
  dataCache: DataCache | null,
  componentCache: ComponentCache | null,
  groupsCache: GroupsCache | null,
  serverAuth: ServerAuthMethod | ServerAuthCredentials
) {
  const app = express()
  const serverAuthCheckFn =
    typeof serverAuth === 'object'
      ? getDefaultPurgeAuthCheck(serverAuth)
      : serverAuth

  // @ts-ignore
  app.use(express.json())

  // Create the middleware to check if a purge request is allowed or not.
  const middleware = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (serverAuthCheckFn(req) === true) {
      next()
    } else {
      res.status(403).send()
    }
  }
  app.use(middleware)

  const caches: Record<string, Cache> = {}
  if (pageCache) {
    caches.page = pageCache
  }
  if (dataCache) {
    caches.data = dataCache
  }
  if (componentCache) {
    caches.component = componentCache
  }
  if (groupsCache) {
    caches.groups = groupsCache
  }
  const allCaches: Cache[] = Object.keys(caches).map((key) => caches[key])

  /*
   * Endpoint to purge the entire cache.
   */
  app.post('/purge/all', async function (_req: Request, res: Response) {
    logger('Purge all')
    try {
      await Promise.all(allCaches.map((v) => v.purgeAll()))
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send({ success: true })
  })

  const tagCount: any[] = []

  async function getTagCount() {
    const tagMap: Record<string, Record<string, number>> = {}
    const cacheKeys = Object.keys(caches)

    for (const key of cacheKeys) {
      const cache = caches[key]
      const items = await cache.getTags()
      items.forEach((item) => {
        const tag = item.tag
        const count = item.count
        if (!tagMap[tag]) {
          tagMap[tag] = {}
        }
        tagMap[tag][key] = count
      })
    }

    return Object.keys(tagMap)
      .map((tag) => {
        return {
          tag,
          counts: tagMap[tag],
          total: Object.keys(tagMap[tag]).reduce((acc, key) => {
            const count = tagMap[tag][key]
            acc += count
            return acc
          }, 0),
        }
      })
      .sort((a, b) => {
        return b.total - a.total
      })
  }

  /*
   * Endpoint to get stats about the tags.
   */
  app.get('/stats/tags', async function (req: Request, res: Response) {
    try {
      const perPage = 196
      const offsetValue = req.query.offset
      const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0
      const rows = await getTagCount()

      const start = offset
      const end = start + (perPage - 1)
      const total = rows.length

      res.json({ rows: rows.slice(start, end), total })
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to purge routes by one or multiple tags.
   */
  app.post('/purge/tags', async function (req: Request, res: Response) {
    const tags = req.body || []
    if (!tags.length) {
      return res.status(400).send({ success: false })
    }
    logger('Purge tags')

    try {
      const allTags = groupsCache?.getAllPurgableTags(tags) || tags
      const resultRoutes = await pageCache?.purgeTags(allTags)
      const resultComponents = await componentCache?.purgeTags(allTags)
      const resultData = await dataCache?.purgeTags(allTags)
      res.status(200).send({
        success: true,
        routes: resultRoutes,
        components: resultComponents,
        data: resultData,
        tags: allTags,
      })
    } catch (e) {
      console.log(e)
      res.status(500).send({ success: false })
    }
  })

  async function getCountsForTag(tag: string) {
    const componentCount = await componentCache?.getCountForTag(tag)
    const dataCount = await dataCache?.getCountForTag(tag)
    return {
      componentCount,
      dataCount,
    }
  }

  /*
   * Endpoint to get stats about data cache.
   */
  app.get('/stats/:cache', async function (req: Request, res: Response) {
    const cacheId = req.params.cache
    const cache = caches[cacheId]

    if (!cache) {
      return res.status(400).send()
    }

    const offsetValue = req.query.offset
    const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0
    try {
      res.json(await cache.getEntries(offset))
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to purge components by key.
   */
  app.post('/purge/:cache', function (req: Request, res: Response) {
    const cacheId = req.params.cache
    const cache = caches[cacheId]

    if (!cache) {
      return res.status(400)
    }
    const items = req.body || []
    if (!items.length) {
      return res.status(400).send({ success: false })
    }
    logger(`Purge ${cacheId}: ` + items.join(', '))

    try {
      cache.purgeKeys(items)
      res.status(200).send({ success: true })
    } catch (e) {
      console.log(e)
      res.status(500).send({ success: false })
    }
  })

  return app
}
