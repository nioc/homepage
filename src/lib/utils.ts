import type { Config, Link, Topic } from '../types/config'
import { load } from 'js-yaml'

export async function fetchConfigFile (fileName: string) {
  const response = await fetch(`./conf/${fileName}.yml`)
  const configApp: Config = load(await response.text(), {
    onWarning: (e) => console.warn(e),
  }) as Config
  if (typeof configApp !== 'object') {
    throw new Error('parsing error, check server response')
  }
  configApp.topics.forEach((topic) => {
    topic.links.forEach((link) => {
      if (link.tags === undefined) {
        link.tags = []
      }
      link.source = fileName
    })
  })
  return configApp
}

export function sortItems (a: Topic | Link, b: Topic | Link) {
  if (a.order === undefined) {
    return b.order === undefined
      ? 0
      : 1
  }
  if (b.order === undefined) {
    return -1
  }
  if (a.order === b.order) {
    return 0
  }
  return a.order > b.order
    ? 1
    : -1
}

export function getAdditionalFiles (config: Config) {
  return [
    // add group files (set by Nginx according to SSO header) only if it matches allowed pattern
    ...config.groupsAdditionalFiles.split(',')
      .filter((fileName) => config.groupsAdditionalFilesPattern
        ? new RegExp(config.groupsAdditionalFilesPattern).test(fileName)
        : true),
    // add file (set by Nginx according to SSO header)
    config.userAdditionalFile,
  ]
    // remove invalid (empty) values
    .filter((fileName) => fileName)
}

export function mergeConfigFile (configFile: Config, mergedConfig: Config) {
  structuredClone(configFile).topics.forEach((topic) => {
    const indexTopic = mergedConfig.topics.findIndex((previousTopic) => previousTopic.name === topic.name)
    if (indexTopic === -1) {
      // add new topic
      mergedConfig.topics.push(topic)
    } else {
      // topic already exists in app config, override order and merge links
      if (topic.order !== undefined) {
        mergedConfig.topics[indexTopic].order = topic.order
      }
      topic.links.forEach((link) => {
        const indexLink = mergedConfig.topics[indexTopic].links.findIndex((previousLink) => previousLink.name === link.name)
        if (indexLink === -1) {
          // add new link
          mergedConfig.topics[indexTopic].links.push(link)
        } else {
          // link already exists, override it
          if (link.order === undefined && mergedConfig.topics[indexTopic].links[indexLink].order !== undefined) {
            link.order = mergedConfig.topics[indexTopic].links[indexLink].order
          }
          mergedConfig.topics[indexTopic].links[indexLink] = link
        }
      })
    }
  })
}

export function sortable (list: HTMLElement, itemsSelector: string, handleSelector: string, ondrop: (dragged: HTMLElement, dropOn: HTMLElement) => void = () => {}) {
  let dragged: HTMLElement | null = null
  if (list === null) {
    return
  }
  for (const draggable of list.querySelectorAll(handleSelector) as NodeListOf<HTMLElement>) {
    draggable.draggable = true

    draggable.ondragstart = (e: DragEvent) => {
      dragged = (e.target as HTMLElement).closest(itemsSelector) as HTMLElement
      if (dragged === null) {
        return
      }
      dragged.classList.add('sort-dragging')
      e.dataTransfer.dropEffect = 'move'
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setDragImage(dragged, 0, 0)
      let currentOverItem: HTMLElement | null = null
      let hasCurrentOver = false

      for (const item of list.querySelectorAll(itemsSelector) as NodeListOf<HTMLElement>) {

        if (item !== dragged) {

          item.ondragover = (e: DragEvent) => {
            e.preventDefault()
          }

          item.ondragenter = (e: DragEvent) => {
            e.preventDefault()
            if (item === dragged) {
              return
            }
            currentOverItem = item
            hasCurrentOver = true
            item.classList.add('sort-over')
          }

          item.ondrop = (e) => {
            e.preventDefault()
            if (dragged && dragged != item) {
              ondrop(dragged, item)
            }
          }
        }

        item.ondragleave = (e: DragEvent) => {
          // as dragLeave comes after dragEnter...
          if (!hasCurrentOver || (e.target as HTMLElement).closest(itemsSelector) !== currentOverItem) {
            item.classList.remove('sort-over')
          }
          hasCurrentOver = false
        }
      }

      draggable.ondragend = () => {
        hasCurrentOver = false
        for (const item of list.querySelectorAll(itemsSelector)) {
          item.classList.remove('sort-over', 'sort-dragging')
        }
      }

    }
  }

}
