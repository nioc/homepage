export type Config = {
  title?: string
  customCssUrl?: string
  displayTitle?: boolean
  displaySearch?: boolean
  displayTags?: boolean
  backgroundImage?: string
  trianglifySeed?: string
  groupsAdditionalFiles?: string
  groupsAdditionalFilesPattern?: string
  userAdditionalFile?: string
  topics: Topic[]
}
export type Topic = {
  name: string
  order?: number
  links: Link[]
}
export type Link = {
  name: string
  order?: number
  iconUrl?: string
  icon?: string
  href: string
  target?: string
  tags?: string[]
  source?: string
}
