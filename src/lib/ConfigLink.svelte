<script lang="ts">
  import mimeDb from 'mime-db'
  import type { Link } from '../types/config'
  import Icon from './Icon.svelte'

  const appUrl = `${document.location.origin}${document.location.pathname}`.replace(/\/$/, '')
  const proxyBaseUrl = 'proxy/?url='

  let {
    link,
    indexTopic,
    indexLink,
    update,
  }: {
    link: Link
    indexTopic: number
    indexLink: number
    update: (indexTopic: number, indexLink: number, arg: Link) => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let _link: Link = $state(structuredClone($state.snapshot(link)))

  let iconsList = $state([])

  let title = $state('')

  let tags = $state(_link.tags?.join(', '))

  let iconMatching: string = $derived(iconsList.find((iconName) => iconName === _link.icon))

  let iconsListMatching: string[] = $state([])
  $effect(() => {
    if (!_link.name) {
      iconsListMatching = []
      return
    }
    // Set a timeout to update the debounced query after 500ms
    const handler = setTimeout(() => {
      iconsListMatching = iconsList
        .filter((iconName) => _link.name
          .split(' ')
          .filter((word) => word.length > 2)
          .map((word) => {
            return word.toLowerCase()
          })
          .some((word) => {
            return iconName === word
          }),
        )
    }, 300)
    return () => clearTimeout(handler)
  })

  let isFetching = $state(false)

  let isInvalidUrl: boolean = $state(null)

  let urlError: string = $state(null)

  let iconUrls = $state([])

  let externalIconSearched = $state(null)

  let externalIconUrl = $state(null)

  let externalIconOk = $state(false)

  let userIconOk = $state(undefined)

  function parseTags() {
    _link.tags = tags
      .split(',')
      .map((tag) => tag.trim())
  }

  async function getUrl() {
    urlError = null
    try {
      let url = new URL(_link.href)
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
            _link.href = new URL(response.url)
              .searchParams
              .get('url')
            // update context to avoid redirect when loading linked images
            url = new URL(_link.href)
          }
          const parser = new DOMParser()
          // get <head>
          const head = parser
            .parseFromString(await response.text(), 'text/html')
            .getElementsByTagName('head')
          // try to set link name from title
          try {
            title = head
              .item(0)
              .querySelectorAll('title')[0]
              .text
              .replaceAll('\t', ' ')
              .trim()
            if (!_link.name) {
              _link.name = title
            }
          } catch (error) {
            console.warn(error.message)
          }
          // list favicons linked
          iconUrls = []
          try {
            head
              .item(0)
              .querySelectorAll('link[rel="icon"]')
              .forEach((iconLink) => {
                const fetchedUrl = iconLink.getAttribute('href')
                const iconUrl = fetchedUrl.startsWith('http')
                  ? fetchedUrl // absolute URL
                  : fetchedUrl.startsWith('//')
                    ? `${url.protocol}${fetchedUrl}` // scheme-relative URL
                    : fetchedUrl.startsWith('/')
                      ? `${url.origin}${fetchedUrl}` // path-absolute URL
                      : `${url.origin}/${fetchedUrl}` // path-relative URL
                iconUrls.push(new URL(iconUrl).href)
              })
          } catch (error) {
            console.warn(error.message)
          }
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
      if (!_link.name) {
        // title not found, use host name
        _link.name = url.hostname
      }
    } catch (error) {
      isInvalidUrl = true
      urlError = ` (${error.message})`
      return false
    }
  }

  async function fetchAndStoreIconUrl(url: string) {
    _link.iconUrl = await saveUrlFile(url, _link.name)
  }

  function getSelfHostedIcon() {
    const searched = externalIconSearched
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
    externalIconUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/${searched}.svg`
  }

  async function saveUrlFile(url: string, filename: string) {
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

  fetch('./icons-list.json')
    .then((result) => result.json())
    .then((list) => (iconsList = [...new Set(list)]))
    .catch((reason) => console.warn(`Get icons list failed: ${reason}`))
</script>

<datalist id="target-proposals">
  <option value="_blank">New tab (_blank)</option>
  <option value="_self">Current tab (_self)</option>
</datalist>

<fieldset disabled={isFetching}>
  <label for="href">URL</label>
  <input
    id="href"
    bind:value={_link.href}
    type="url"
    placeholder="https://service.domain.ltd/"
    onchange={getUrl}
    aria-describedby="url-helper"
    required
    aria-invalid={isInvalidUrl} />
  {#if isInvalidUrl !== false}
    <small id="url-helper">Type an URL{urlError}</small>
  {/if}

  {#if _link.href}
    <label for="name">Name</label>
    <input
      id="name"
      bind:value={_link.name}
      type="text"
      placeholder="Name"
      aria-describedby="name-helper"
      required
      aria-invalid={_link.name ? false : true} />
    {#if title && _link.name !== title}
      <small id="name-helper">Current url returns title: <i class="selectable">{title}</i></small>
    {/if}

    <label for="icon">Icon</label>
    <p><small>Icon can be set using the link name or using returned favicon (the latter requires downloading the favicon and will take precedence)</small></p>

    <small>Search link name in <a href="https://simpleicons.org/" target="_blank" rel="noreferrer" style="padding: 0;">Simple Icons</a> and <a href="https://pictogrammers.com/library/mdi/" target="_blank" rel="noreferrer" style="padding: 0;">Pictogrammers Material Design Icons</a></small>
    <div>
      {#each iconsListMatching as icon (icon)}
        <button class="icon-url-proposal" title="Use this icon" onclick={() => (_link.icon = icon)}>
          <Icon {icon} size={2} />
        </button>
      {/each}
    </div>
    <div class="icon-field">
      <input
        id="icon"
        bind:value={_link.icon}
        type="text"
        placeholder="Icon"
        aria-invalid={iconMatching ? false : _link.icon ? true : undefined} />
      <div>
        {#if iconMatching}
          {#key iconMatching}
            <Icon icon={iconMatching} size={1} />
          {/key}
        {/if}
      </div>
    </div>

    <small>Search icon in <a href="https://selfh.st/icons/" target="_blank" rel="noreferrer" style="padding: 0;">Self-Hosted Dashboard Icons</a></small>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <fieldset role="group">
      <input type="text" placeholder="Search for icon" bind:value={externalIconSearched} />
      <button onclick={getSelfHostedIcon}><Icon icon="search-web" size={1} /></button>
    </fieldset>
    <div>
      <button
        class="icon-url-proposal"
        title="Fetch and store this icon using link name"
        style={externalIconOk ? 'display: block' : 'display: none;'}
        onclick={() => fetchAndStoreIconUrl(externalIconUrl)}>
        <img src={externalIconUrl} height="36" width="36" aria-hidden="true" alt={externalIconUrl} onload={() => externalIconOk = true} onerror={() => externalIconOk = false}/>
      </button>
    </div>

    <div>
      {#each iconUrls as iconUrl (iconUrl)}
        <button
          class="icon-url-proposal"
          title="Fetch and store this icon using link name"
          onclick={() => fetchAndStoreIconUrl(iconUrl)}>
          <img src={proxyBaseUrl + iconUrl} height="36" width="36" aria-hidden="true" alt={iconUrl} />
        </button>
      {/each}
    </div>
    <div class="icon-field">
      <input
        id="iconUrl"
        bind:value={_link.iconUrl}
        type="text"
        placeholder="/files/icon.svg"
        aria-invalid={_link.iconUrl ? !userIconOk : undefined}
        aria-describedby="icon-url-helper" />
      <small id="icon-url-helper"
        >{iconUrls.length
          ? 'Click on an icon to download and save it'
          : 'The file must exist in your `files` folder'}</small>
      <div>
        <!-- svelte-ignore a11y_missing_attribute -->
        <img src={_link.iconUrl} height="18" aria-hidden="true" onload={() => userIconOk = true} onerror={() => userIconOk = false}/>
      </div>
    </div>

    <label for="order">Order</label>
    <input id="order" bind:value={_link.order} type="number" placeholder="0" />

    <label for="target">Target</label>
    <input id="target" bind:value={_link.target} type="text" placeholder="_blank" list="target-proposals" />

    <label for="tags">Tags</label>
    <input
      id="tags"
      bind:value={tags}
      type="text"
      placeholder="new tag"
      aria-describedby="tags-helper"
      onchange={parseTags} />
    <small id="tags-helper">Comma-separated values</small>
  {/if}
</fieldset>
<footer>
  <button onclick={() => update(indexTopic, indexLink, null)}>Cancel</button>
  {#if _link.href}
    <button onclick={() => update(indexTopic, indexLink, _link)}>Confirm</button>
  {/if}
</footer>
