import express, { NextFunction, Request, Response } from 'express'
import Cache from './Cache'

export type PurgeAuthCheckMethod = (req: Request) => boolean

function getDefaultPurgeAuthCheck(secret: string) {
  return function (req: Request) {
    const providedSecret = req.header('x-nuxt-cache-secret') || req.query.secret
    return providedSecret === secret
  }
}

export default function createServerMiddleware(
  cache: Cache,
  purgeAuthCheck: PurgeAuthCheckMethod|string,
) {
  const app = express()
  const purgeAuthCheckFn = typeof purgeAuthCheck === 'string' ? getDefaultPurgeAuthCheck(purgeAuthCheck) : purgeAuthCheck

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
    const tags = req.body
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
      const stats = {}
      res.json(stats)
    } catch (e) {
      res.status(500).send()
    }
  })

  return app
}
