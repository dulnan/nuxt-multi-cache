import express, { NextFunction, Request, Response } from 'express'
import Cache from './Cache'

export type PurgeAuthCheckMethod = (req: Request) => boolean

function defaultPurgeAuthCheck(req: Request, secret: string) {
  const providedSecret = req.header('x-nuxt-cache-secret') || req.query.secret
  return providedSecret === secret
}

export default function createServerMiddleware(
  cache: Cache,
  secret: string,
  purgeAuthCheck?: PurgeAuthCheckMethod
) {
  const app = express()

  // Create the middleware to check if a purge request is allowed or not.
  const checkFunction = purgeAuthCheck || defaultPurgeAuthCheck
  const middleware = function (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (checkFunction(req, secret)) {
      next()
    } else {
      res.status(403).send()
    }
  }
  app.use(middleware)

  /*
   * Endpoint to purge the entire cache.
   */
  app.post('/purge_all', async function (_req: Request, res: Response) {
    try {
      await cache.purgeAll()
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send()
  })

  /*
   * Endpoint to purge one or multiple routes.
   */
  app.post('/purge_routes', async function (req: Request, res: Response) {
    const value = req.header('x-nuxt-cache-purge-routes') || ''
    const routes = value.split('||').filter(Boolean)
    if (!routes.length) {
      return res.status(400).send()
    }
    try {
      await cache.purgeRoutes(routes)
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send()
  })

  /*
   * Endpoint to purge routes by one or multiple tags.
   */
  app.post('/purge_tags', async function (req: Request, res: Response) {
    const value = req.header('x-nuxt-cache-purge-tags') || ''
    const tags = value.split('||').filter(Boolean)
    if (!tags.length) {
      return res.status(400).send()
    }
    try {
      await cache.purgeTags(tags)
    } catch (e) {
      res.status(500).send()
    }
    res.status(200).send()
  })

  /*
   * Endpoint to get stats about the cache.
   */
  app.get('/stats', async function (_req: Request, res: Response) {
    try {
      const stats = await cache.getStats()
      res.json(stats)
    } catch (e) {
      res.status(500).send()
    }
  })

  return app
}
