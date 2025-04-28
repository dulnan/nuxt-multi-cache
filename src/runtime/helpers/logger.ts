import { createConsola, type ConsolaInstance } from 'consola/core'

type Logger = ConsolaInstance | typeof console

// This looks weird, but it's the only way to prevent bundling consola in the
// client build.
const consola = import.meta.server
  ? createConsola().withTag('nuxt-multi-cache')
  : undefined
export const logger: Logger = (import.meta.server ? consola : console) as Logger
