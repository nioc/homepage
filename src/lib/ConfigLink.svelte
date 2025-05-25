<script lang="ts">
  import { dump } from 'js-yaml'
  import mimeDb from 'mime-db'
  import type { Link } from '../types/config'
  import Icon from './Icon.svelte'

  const appUrl = `${document.location.origin}${document.location.pathname}`.replace(/\/$/, '')
  const proxyBaseUrl = 'proxy/?url='

  let link: Link = $state({
    name: '',
    href: '',
    icon: '',
    iconUrl: '',
    order: 0,
    tags: undefined,
    target: '',
  })

  let iconsList = $state([])

  let title = $state('')

  let iconMatching: string = $derived(iconsList.find((iconName) => iconName === link.icon))

  let iconsListMatching: string[] = $state([])
  $effect(() => {
    if (!link.name) {
      iconsListMatching = []
      return
    }
    // Set a timeout to update the debounced query after 500ms
    const handler = setTimeout(() => {
      iconsListMatching = iconsList
        .filter((iconName) => link.name
          .split(' ')
          .filter((word) => word.length > 2)
          .map((word) => {
            return word.toLowerCase()
          })
          .some((word) => {
            return iconName === word
          }))
    }, 300)
    return () => clearTimeout(handler)
  })

  let isFetching = $state(false)

  let isInvalidUrl: boolean = $state(null)

  let urlError: string = $state(null)

  let yamlLinkString: string = $derived(dump({ topics: [link] }, {
    replacer: (_key, value) => {
      return !value
        ? undefined
        : value
    },
  }).replace('topics:\n', ''))

  let iconUrls = $state([])

  async function getUrl () {
    urlError = null
    try {
      let url = new URL(link.href)
      try {
        // try to get info from URL
        isFetching = true
        const response = await fetch(`${proxyBaseUrl}${encodeURI(url.href)}`, {
          referrer: '',
          redirect: 'follow',
          headers: {
            'X-Homepage-URL': appUrl,
          },
        })
        if (response.ok) {
          if (response.redirected) {
            // update input URL href
            link.href = new URL(response.url)
              .searchParams
              .get('url')
            // update context to avoid redirect when loading linked images
            url = new URL(link.href)
          }
          const parser = new DOMParser()
          // get <head>
          const head = parser
            .parseFromString(await response.text(), 'text/html')
            .getElementsByTagName('head')
          // try to set link name from title
          title = head
            .item(0)
            .querySelectorAll('title')[0]
            .text
            .replaceAll('\t', ' ')
            .trim()
          if (!link.name) {
            link.name = title
          }
          // list favicons linked
          iconUrls = []
          head.item(0).querySelectorAll('link[rel="icon"]')
            .forEach((iconLink) => {
              const fetchedUrl = iconLink.getAttribute('href')
              const iconUrl = fetchedUrl.startsWith('http')
                ? fetchedUrl // absolute URL
                : fetchedUrl.startsWith('//')
                  ? `${url.protocol}${fetchedUrl}` // scheme-relative URL
                  : fetchedUrl.startsWith('/')
                    ? `${url.origin}${fetchedUrl}` // path-absolute URL
                    : `${url.origin}/${fetchedUrl}` // path-relative URL
              iconUrls.push(
                new URL(iconUrl).href,
              )
            })
          isInvalidUrl = false
        } else {
          isInvalidUrl = true
          urlError = ` (${response.statusText})`
        }
      } catch (error) {
        isInvalidUrl = true
        urlError = ` (${error.message})`
        console.warn(error.message)
      }
      isFetching = false
      if (!link.name) {
        // title not found, use host name
        link.name = url.hostname
      }
    } catch (error) {
      isInvalidUrl = true
      urlError = ` (${error.message})`
      yamlLinkString = ''
      return false
    }
  }

  async function fetchAndStoreIconUrl (url: string) {
    link.iconUrl = await saveUrlFile(url, link.name)
  }

  async function saveUrlFile (url: string, filename: string) {
    try {
      if (!filename) {
        throw new Error('invalid filename')
      }
      const response = await fetch(`${proxyBaseUrl}${encodeURI(url)}`, {
        referrer: '',
        redirect: 'follow',
        headers: {
          'X-Homepage-URL': appUrl,
        },
      })
      if (response.ok) {
        const file = await response.bytes()
        // get file extension
        const mime = mimeDb[response.headers.get('content-type')]
        const extension = mime
          ? `.${mime.extensions[0]}`
          : ''
        // clean filename
        const uploadUrl = `${filename
          .replaceAll(/[^a-zA-Z0-9]/g, '-')
          .replaceAll(/-{2,}/g, '-')
          .toLowerCase()}${extension}`
        // upload file
        const uploadResponse = await fetch(`/uploads/${uploadUrl}`, {
          method: 'PUT',
          body: file,
        })
        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`)
        }
        return `/files/${uploadUrl}`
      }
    } catch (error) {
      console.warn(error.message)
    }
  }

  // eslint-disable-next-line promise/catch-or-return
  fetch('./icons-list.json')
    .then((result) => result.json())
    .then((list) => iconsList = list)

</script>

<datalist id="target-proposals">
  <option value="_blank">New tab (_blank)</option>
  <option value="_self">Current tab (_self)</option>
</datalist>

<fieldset class="config-container" disabled={isFetching}>
  <h3>Add a link</h3>

  <label for="href">URL</label>
  <input id="href" bind:value={link.href} type="url" placeholder="https://service.domain.ltd/" onchange={getUrl} aria-describedby="url-helper" required aria-invalid={isInvalidUrl} />
  {#if isInvalidUrl !== false}
    <small id="url-helper">Type an URL{urlError}</small>
  {/if}

  {#if isInvalidUrl === false}
    <label for="name">Name</label>
    <input id="name" bind:value={link.name} type="text" placeholder="Name" aria-describedby="name-helper" required aria-invalid={link.name
      ? false
      : true}/>
    {#if link.name !== title}
      <small id="name-helper">Current url returns title: <i class="selectable">{title}</i></small>
    {/if}

    <label for="icon">Icon</label>
    <div>
      {#each iconsListMatching as icon, index (index)}
        <button class="icon-url-proposal" title="Use this icon" onclick={() => link.icon = icon}>
          {#key icon}
            <Icon {icon} size={2} />
          {/key}
        </button>
      {/each}
    </div>
    <div class="icon-field">
      <input id="icon" bind:value={link.icon} type="text" placeholder="Icon" aria-invalid={iconMatching
        ? false
        : link.icon
          ? true
          : undefined}/>
      <div>
        {#if iconMatching}
          {#key iconMatching}
            <Icon icon={iconMatching} size={1} />
          {/key}
        {/if}
      </div>
    </div>

    <label for="iconUrl">Icon URL</label>
    <div>
      {#each iconUrls as iconUrl, index (index)}
        <button class="icon-url-proposal" title="Fetch and store this icon using link name" onclick={() => fetchAndStoreIconUrl(iconUrl)}>
          <img src={proxyBaseUrl + iconUrl} height="36" width="36" aria-hidden="true" alt={iconUrl}/>
        </button>
      {/each}
    </div>
    <div class="icon-field">
      <input id="iconUrl" bind:value={link.iconUrl} type="text" placeholder="/files/icon.svg" aria-describedby="icon-url-helper" />
      <small id="icon-url-helper">{iconUrls.length
        ? 'Click on an icon to download and save it'
        : 'The file must exist in your `files` folder'}</small>
      <div>
        <!-- svelte-ignore a11y_missing_attribute -->
        <img src={link.iconUrl} height="18" aria-hidden="true"/>
      </div>
    </div>

    <label for="order">Order</label>
    <input id="order" bind:value={link.order} type="number" placeholder="0" />

    <label for="target">Target</label>
    <input id="target" bind:value={link.target} type="text" placeholder="_blank" list="target-proposals" />

    <div class="label">Append this to your YAML configuration file:</div>
    <pre class="selectable"><code>{yamlLinkString}</code></pre>
  {/if}
</fieldset>
