<script lang="ts">
  import { onMount, type Component } from 'svelte'
  import { load } from 'js-yaml'
  import Home from './lib/Home.svelte'
  import type { Config } from './types/config'

  let configComponent: Component<Record<string, never>, object, ''>
  let config: Config = {
    topics: [],
  }
  let message: string = null
  let isConfigMode = false
  let isReady = false

  async function fetchConfig (fileName: string) {
    try {
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
        })
      })
      return configApp
    } catch (error) {
      const errorMessage = `An error occurred while processing "conf/${fileName}.yml" file: ${error.message}`
      console.warn(errorMessage)
      if (fileName === 'app') {
        message = errorMessage
      }
    }
  }

  async function setTrianglify (seed: string, isDark: boolean) {
    const trianglify = (await import('@victorioberra/trianglify-browser/dist/trianglify.bundle.js')).default
    const chroma = (await import('chroma-js')).default
    const backgroundColor = getComputedStyle(document.body).getPropertyValue('--hp-background-color')
    let chromaBg = chroma(backgroundColor)
    const colorsCount = 5
    const coef = 6
    const colors = []
    if (isDark) {
      chromaBg = chromaBg.darken(1)
      for (let i = 0; i < colorsCount; i++) {
        colors.push(chromaBg
          .brighten(i / colorsCount * coef)
          .hex())
      }
    } else {
      chromaBg = chromaBg.brighten(1)
      for (let i = 0; i < colorsCount; i++) {
        colors.push(chromaBg
          .darken(i / colorsCount * coef)
          .hex())
      }
      colors.reverse()
    }
    for (let i = 1; i < colorsCount; i++) {
      colors.push(colors[colorsCount - 1 - i])
    }

    const pattern = trianglify({
      width: window.innerWidth,
      height: window.innerHeight,
      seed,
      cellSize: 35,
      variance: 0.85,
      xColors: colors,
    })
    // @ts-expect-error no type provided
    const svgEncoded = window.btoa(pattern.toSVG().outerHTML)
    const html = document.querySelector<HTMLElement>('html')
    html.style.setProperty('background-image', `url("data:image/svg+xml;base64,${svgEncoded}")`)
    html.style.setProperty('background-size', 'cover')
    html.style.setProperty('background-attachment', 'fixed')
    html.style.setProperty('--hp-background-gradient-opacity', '0.2')
  }

  onMount(async () => {
    // fetch app config
    const configFile = await fetchConfig('app')
    if (!configFile) {
      isReady = true
      return
    }
    config = Object.assign({}, config, configFile)

    // use app config
    if (config.title) {
      document.title = config.title
    }

    if (config.customCssUrl) {
      const customCssNode = document.createElement('link')
      customCssNode.setAttribute('rel', 'stylesheet')
      customCssNode.setAttribute('href', config.customCssUrl)
      document.getElementsByTagName('head')[0].appendChild(customCssNode)
    }

    if (config.trianglifySeed) {
      const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      await setTrianglify(config.trianglifySeed, darkMediaQuery.matches)
      darkMediaQuery.addEventListener('change', (e) => {
        setTrianglify(config.trianglifySeed, e.matches)
      })
    } else {
      if (config.backgroundImage) {
        // set provided background image only if trianglify is not used
        const html = document.querySelector<HTMLElement>('html')
        html.style.setProperty('background-image', `url("${config.backgroundImage}")`)
        html.style.setProperty('background-size', 'cover')
      }
    }

    if (config.displayTags) {
      const root = document.querySelector<HTMLElement>('#app')
      root.classList.add('with-tags')
    }

    if (config.groupsAdditionalFiles || config.userAdditionalFile) {
      const additionalFiles = [
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

      for (const fileName of additionalFiles) {
        const configFile = await fetchConfig(fileName)
        if (configFile) {
          configFile.topics.forEach((topic) => {
            const indexTopic = config.topics.findIndex((previousTopic) => previousTopic.name === topic.name)
            if (indexTopic === -1) {
              // add new topic
              config.topics.push(topic)
            } else {
              // topic already exists in app config, override order and merge links
              if (topic.order !== undefined) {
                config.topics[indexTopic].order = topic.order
              }
              topic.links.forEach((link) => {
                const indexLink = config.topics[indexTopic].links.findIndex((previousLink) => previousLink.name === link.name)
                if (indexLink === -1) {
                  // add new link
                  config.topics[indexTopic].links.push(link)
                } else {
                  // link already exists, override it
                  if (link.order === undefined && config.topics[indexTopic].links[indexLink].order !== undefined) {
                    link.order = config.topics[indexTopic].links[indexLink].order
                  }
                  config.topics[indexTopic].links[indexLink] = link
                }
              })
            }
          })
        }
      }
    }

    if (new URLSearchParams(document.location.search).has('config')) {
      configComponent = (await import('./lib/ConfigLink.svelte')).default
      isConfigMode = true
      return
    }

    isReady = true
  })
</script>

<main>
  {#if isConfigMode}
    <svelte:component this={configComponent} />
  {/if}
  {#if isReady}
    {#if config.displayTitle}
      <h1>{config.title}</h1>
    {/if}

    {#if message}
      <pre class="error">{message}</pre>
    {/if}

    <Home displaySearch={config.displaySearch} topics={config.topics}/>
  {/if}
</main>
