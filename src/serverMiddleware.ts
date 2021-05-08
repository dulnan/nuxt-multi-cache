import express, { NextFunction, Request, Response } from 'express'
import Cache from './Cache'
import ComponentCache from './ComponentCache'
import DataCache from './DataCache'

export type PurgeAuthCheckMethod = (req: Request) => boolean

function getDefaultPurgeAuthCheck(secret: string) {
  return function (req: Request) {
    const providedSecret = req.header('x-nuxt-cache-secret') || req.query.secret
    return providedSecret === secret
  }
}

function logger(message: any) {
  console.log('serverMiddleware: ', message)
}

export default function createServerMiddleware(
  cache: Cache,
  dataCache: DataCache,
  componentCache: ComponentCache,
  purgeAuthCheck: PurgeAuthCheckMethod|string,
) {
  const app = express()
  const purgeAuthCheckFn = typeof purgeAuthCheck === 'string' ? getDefaultPurgeAuthCheck(purgeAuthCheck) : purgeAuthCheck
  app.use(express.json())

  // Create the middleware to check if a purge request is allowed or not.
  const middleware = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (purgeAuthCheckFn(req)) {
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
      await cache.purgeAll()
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send()
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
      await cache.purgeTags(tags)
      console.log('success')
      res.status(200).send({ success: true })
    } catch (e) {
      console.log(e)
      res.status(500).send({ success: false })
    }
  })

  /*
   * Endpoint to purge a single route.
   */
  app.post('/purge/route/:rid', async function (req: Request, res: Response) {
    const rid = parseInt(req.params.rid)
    if (!rid) {
      return res.status(400).send()
    }
    logger('Purge route')

    try {
      const route = await cache.purgeRoute(rid)
      res.json({ success: true, route }).send()
    } catch (e) {
      res.status(500).send({
        success: false,
        error: 'Failed to purge route.'
      })
    }
  })

  /*
   * Endpoint to purge by URL.
   */
  app.post('/purge/url', async function (req: Request, res: Response) {
    logger('Purge urls')
    const urls = req.body
    if (!urls) {
      return res.status(400).send({ success: false })
    }

    try {
      const success = await cache.purgeUrls(urls)
      res.json({ success }).send()
    } catch (e) {
      res.status(500).send({
        success: false,
        error: 'Failed to purge route.'
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
      const tag = typeof req.query.tag === 'string' ? req.query.tag : ''
      res.json(cache.getRoutes(offset, tag))
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
      res.json(cache.getTags(offset))
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
      res.json(componentCache.getEntries(offset))
    } catch (e) {
      res.status(500).send({ success: false })
    }
  })

  return app
}
