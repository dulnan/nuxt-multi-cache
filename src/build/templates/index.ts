import type { ModuleTemplate } from './defineTemplate'
import serverOptions from './definitions/server-options'
import nitro from './definitions/nitro'
import config from './definitions/config'

export const TEMPLATES: ModuleTemplate[] = [serverOptions, nitro, config]
