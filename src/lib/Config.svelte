<script lang="ts">
  import { fetchConfigFile, getAdditionalFiles, mergeConfigFile, sortItems } from './utils'
  import type { Config } from '../types/config'
  import ConfigFile from './ConfigFile.svelte'

  let configFilesObj: Record<string, Config> = $state({})

  let mergedConfig: Config = $derived.by(() => {
    let _mergedConfig: Config = { title: '', topics: [] }
    const appConfigFile = configFilesObj['app']
    mergeConfigFile($state.snapshot(appConfigFile), _mergedConfig)
    for (const filename of getAdditionalFiles(appConfigFile)) {
      if (configFilesObj[filename]) {
        mergeConfigFile($state.snapshot(configFilesObj[filename]), _mergedConfig)
      }
    }
    _mergedConfig.topics.sort(sortItems)
    _mergedConfig.topics.forEach((topic) => topic.links.sort(sortItems))
    return _mergedConfig
  })

  const fetchConfig = async () => {
    const configFile = await fetchConfigFile('app')
    configFilesObj['app'] = configFile
    for (const filename of getAdditionalFiles(configFile)) {
      try {
        const configFile = await fetchConfigFile(filename)
        if (configFile) {
          configFilesObj[filename] = configFile
        }
      } catch (error) {
        console.warn(`An error occurred while processing "conf/${filename}.yml" file: ${error.message}`)
      }
    }
  }
</script>

{#await fetchConfig()}
  <p class="config-container">Loading config...</p>
{:then}
  <fieldset class="config-container">
    <h2>App configuration</h2>
    <label><span>Title</span><input bind:value={configFilesObj['app'].title} type="text" placeholder="Homepage" required aria-invalid={configFilesObj['app'].title.length === 0} /></label>
    <label><input type="checkbox" role="switch" bind:checked={configFilesObj['app'].displayTitle} />Display title</label>
    <label><input type="checkbox" role="switch" bind:checked={configFilesObj['app'].displaySearch} />Display search field</label>
    <label><input type="checkbox" role="switch" bind:checked={configFilesObj['app'].displayTags} />Display tags</label>
    <label><span>Custom CSS file URL </span><input bind:value={configFilesObj['app'].customCssUrl} type="url" placeholder="/files/custom.css" /></label>
    <label><span>Background image URL </span><input bind:value={configFilesObj['app'].backgroundImage} type="url" placeholder="/files/my-background.png" /></label>
    <label><span>Trianglify seed</span><input bind:value={configFilesObj['app'].trianglifySeed} type="text" placeholder="myseed" /></label>
    <label><span>Regular expression to validate additional group file names</span><input bind:value={configFilesObj['app'].groupsAdditionalFilesPattern} type="text" placeholder="^(dev|admin)$" /></label>
    <h2>Topics</h2>
    <h3>Aggregate output</h3>
    <ConfigFile config={mergedConfig} isMerged />
    {#each Object.keys(configFilesObj) as filename (filename)}
      <hr/>
      <article id={`${filename}.yml`}>
        <h3>File <code>{filename}.yml</code></h3>
        <div style="margin: 0 1.5rem;">
          <ConfigFile bind:config={configFilesObj[filename]} {filename} />
        </div>
      </article>
    {/each}
  </fieldset>
{:catch error}
  <pre class="error">Something went wrong: {error.message}</pre>
{/await}
