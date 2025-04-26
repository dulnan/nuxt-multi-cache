import { consola } from 'consola'

export const logger = import.meta.client
  ? console
  : consola.withTag('nuxt-multi-cache')
