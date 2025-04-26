import type { ModuleTemplate } from './defineTemplate'
import serverOptions from './definitions/server-options'
import nitro from './definitions/nitro'

export const TEMPLATES: ModuleTemplate[] = [serverOptions, nitro]
