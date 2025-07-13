import type { ModuleHelper } from '../ModuleHelper'

type TemplateOptions = {
  path: string
  virtual?: boolean
  isFullPath?: boolean
}

type TemplateCallback = (helper: ModuleHelper) => string

export type ModuleTemplate = {
  options: TemplateOptions
  build: TemplateCallback | null
  buildTypes: TemplateCallback | null
  virtual?: boolean
}

export function defineTemplate(
  options: TemplateOptions,
  build: TemplateCallback | null,
  buildTypes: TemplateCallback | null,
): ModuleTemplate {
  return {
    options,
    build,
    buildTypes,
  }
}
