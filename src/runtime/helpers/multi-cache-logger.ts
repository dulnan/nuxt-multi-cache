import { createConsola, type ConsolaInstance } from 'consola'

type Logger = ConsolaInstance | typeof console

// The contents of this file are overriden by the build plugin provided by
// the module. For client bundles it will replace it with a single export:
// export const logger = console
export const logger: Logger = import.meta.client
  ? console
  : createConsola().withTag('nuxt-multi-cache')
