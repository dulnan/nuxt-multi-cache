import express, { NextFunction, Request, Response } from 'express'
import FilesystemCache from './../Cache/Filesystem'
import ComponentCache from './../Cache/Component'
import DataCache from './../Cache/Data'
import basicAuth from 'basic-auth'
export { getServerCacheKey } from './../helpers/frontend'

export type ServerAuthMethod = (req: Request) => boolean
export interface ServerAuthCredentials {
  username: string
  password: string
}

function getDefaultPurgeAuthCheck(config: ServerAuthCredentials): ServerAuthMethod {
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
  cache: FilesystemCache|null,
  dataCache: DataCache|null,
  componentCache: ComponentCache|null,
  serverAuth: ServerAuthMethod|ServerAuthCredentials
) {
  const app = express()
  const serverAuthCheckFn = typeof serverAuth === 'object' ? getDefaultPurgeAuthCheck(serverAuth) : serverAuth
  app.use(express.json())

  // Create the middleware to check if a purge request is allowed or not.
  const middleware = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (serverAuthCheckFn(req)) {
      next()
    } else {
      res.status(403).send()
    }
  }
  app.use(middleware)

  /*
   * Endpoint to purge the entire cache.
   */
  app.post('/purge/all', async function (_req: Request, res: Response) {
    logger('Purge all')
    try {
      await cache?.purgeAll()
      dataCache?.purgeAll()
      componentCache?.purgeAll()
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send({ success: true })
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
    console.log(tags)

    try {
      const allTags = await cache?.getAllPurgableTags(tags)
      const resultRoutes = await cache?.purgeTags(allTags)
      const resultComponents = componentCache?.purgeTags(allTags)
      const resultData = dataCache?.purgeTags(allTags)
      console.log('Purged tags: ')
      console.table(allTags)
      res.status(200).send({ success: true, routes: resultRoutes, components: resultComponents, data: resultData })
    } catch (e) {
      console.log(e)
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to purge components by key.
   */
  app.post('/purge/components', function (req: Request, res: Response) {
    const components = req.body || []
    if (!components.length) {
      return res.status(400).send({ success: false })
    }
    logger('Purge components: ' + components.join(', '))

    try {
      componentCache?.purge(components)
      console.log('success')
      res.status(200).send({ success: true })
    } catch (e) {
      console.log(e)
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to purge by URL.
   */
  app.post('/purge/routes', async function (req: Request, res: Response) {
    logger('Purge urls')
    const urls = req.body
    if (!urls) {
      return res.status(400).send({ success: false })
    }

    try {
      const success = await cache?.purgeUrls(urls)
      res.json({ success }).send()
    } catch (e) {
      res.status(500).send({
        success: false,
        error: 'Failed to purge routes.'
      })
    }
  })

  /*
   * Endpoint to purge by URL.
   */
  app.post('/purge/data', async function (req: Request, res: Response) {
    logger('Purge urls')
    const keys = req.body
    if (!keys) {
      return res.status(400).send({ success: false })
    }

    try {
      keys.forEach((key: string) => {
        dataCache?.purgeEntry(key)
      })
      res.json({ success: true }).send()
    } catch (e) {
      res.status(500).send({
        success: false,
        error: 'Failed to purge routes.'
      })
    }
  })

  /*
   * Endpoint to get stats about the cache.
   */
  app.get('/stats/routes', async function (req: Request, res: Response) {
    try {
      const offsetValue = req.query.offset
      const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0
      res.json(await cache?.getRoutes(offset))
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to get stats about the tags.
   */
  app.get('/stats/tags', async function (req: Request, res: Response) {
    try {
      const offsetValue = req.query.offset
      const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0

      const result = await cache?.getTags(offset)
      const rows = result?.rows.map(row => {
        return {
          ...row,
          componentCount: componentCache?.getCountForTag(row.tag),
          dataCount: dataCache?.getCountForTag(row.tag),
        }
      })

      res.json({ total: result?.total, rows })
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to get stats about the tags.
   */
  app.get('/stats/components', async function (req: Request, res: Response) {
      const offsetValue = req.query.offset
      const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0
    try {
      res.json(componentCache?.getEntries(offset))
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to get stats about data cache.
   */
  app.get('/stats/data', async function (req: Request, res: Response) {
      const offsetValue = req.query.offset
      const offset = typeof offsetValue === 'string' ? parseInt(offsetValue) : 0
    try {
      res.json(dataCache?.getEntries(offset))
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to get stats about cache groups.
   */
  app.get('/stats/cache_groups', async function (req: Request, res: Response) {
    try {
      res.json(await cache?.getCacheGroups())
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  return app
}
