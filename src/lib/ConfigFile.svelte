<script lang="ts">
  import { dump } from 'js-yaml'
  import type { Link, Config, Topic } from '../types/config'
  import ConfigLink from './ConfigLink.svelte'
  import Editable from './Editable.svelte'
  import Modal, { type ConfirmModal } from './Modal.svelte'
  import Icon from './Icon.svelte'
  import IconTrash from './IconTrash.svelte'
  import IconPencil from './IconPencil.svelte'
  import IconAddLink from './IconAddLink.svelte'
  import IconSave from './IconSave.svelte'
  import IconDrag from './IconDrag.svelte'
  import { sortable } from './utils'

  let {
    config = $bindable(),
    filename,
    isMerged = false,
  }: {
    config: Config,
    filename?: string,
    isMerged?: boolean,
  } = $props()

  let sortableList: HTMLElement

  let editedLink: {indexTopic: number, indexLink: number} = $state(null)

  let confirmModal: ConfirmModal = $state(null)

  let message: {title: string, text: string} = $state(null)

  let isSaving = $state(false)
  let isSaved = $state(false)

  const removeTopic = (indexTopic: number) => {
    confirmModal = {
      text: `Are you sure you want to delete the topic “${config.topics[indexTopic].name}”?`,
      confirm: () => {
        config.topics.splice(indexTopic, 1)
        confirmModal = null
      },
      cancel: () => confirmModal = null,
    }
  }

  const removeLink = (indexTopic: number, indexLink: number) => {
    confirmModal = {
      text: `Are you sure you want to delete the link “${config.topics[indexTopic].links[indexLink].name}”?`,
      confirm: () => {
        config.topics[indexTopic].links.splice(indexLink, 1)
        confirmModal = null
      },
      cancel: () => confirmModal = null,
    }
  }

  const updateLink = (indexTopic: number, indexLink: number, link: Link | null) => {
    if (link) {
      config.topics[indexTopic].links[indexLink] = link
    }
    editedLink = null
  }

  const getYamlContent = () => {
    const _config: Config = structuredClone($state.snapshot(config))
    _config.topics = _config.topics.map((topic) => {
      topic.links.map((link) => {
        link.source = undefined
        return link
      })
      return topic
    })
    _config.groupsAdditionalFiles = null
    _config.userAdditionalFile = null
    return dump(_config)
      .replace('groupsAdditionalFiles: null', 'groupsAdditionalFiles: ')
      .replace('userAdditionalFile: null', 'userAdditionalFile: ')
  }

  const saveFile = async () => {
    isSaved = false
    isSaving = true
    try {
      const uploadResponse = await fetch(`/admin/conf/${filename}.yml`, {
        method: 'PUT',
        body: getYamlContent(),
      })
      if (!uploadResponse.ok) {
        throw new Error(`YAML file upload failed: ${uploadResponse.statusText}`)
      }
      isSaved = true
    } catch (error) {
      message = {
        title: 'Upload failed',
        text: error.message,
      }
    }
    isSaving = false
  }

  const updateSortable = (topics: Topic[]) => {
    const size = topics.length
    if (size > 0) {
      sortable(sortableList, 'tr:not(.subtitle)', '.sort-handle', (_a, _b) => {
        const a = {
          topic: parseInt(_a.dataset.topic),
          link: parseInt(_a.dataset.link),
        }
        const b = {
          topic: parseInt(_b.dataset.topic),
          link: parseInt(_b.dataset.link),
        }
        const moved = config.topics[a.topic].links[a.link]
        config.topics[a.topic].links.splice(a.link, 1)
        config.topics[b.topic].links.splice(b.link, 0, moved)
      })
    }
  }

  $effect(() => {
    if (!isMerged) {
      updateSortable(config.topics)
    }
  })
</script>

<div class="table-container">
  <table>
    <thead>
      <tr>
        <th scope="col" colspan={isMerged
          ? 1
          : 2}></th>
        <th scope="col">Name</th>
        <th scope="col" class="expand">URL</th>
        <th scope="col">Tags</th>
        <th scope="col">Order</th>
        {#if isMerged}<th scope="col">Source</th>
        {:else}<th scope="col" colspan="2" class="shrink"></th>{/if}
      </tr>
    </thead>
    <tbody bind:this={sortableList}>
      {#each config.topics as topic, indexTopic (topic)}
        <tr class="subtitle">
          <td colspan={isMerged
            ? 1
            : 2}></td>
          {#if isMerged}
            <td colspan="3"><strong>{topic.name}</strong></td>
            <td>{topic.order}</td>
            <td></td>
          {:else}
            <td colspan="3"><Editable bind:value={config.topics[indexTopic].name} tag="strong" type="text" placeholder="Topic name" title="Edit topic name" isInvalid={(value: string) => value.length === 0} /></td>
            <td><Editable bind:value={config.topics[indexTopic].order} tag="span" type="number" placeholder="Topic order" title="Edit topic order" size={1} style="min-width: min-content;"/></td>
            <td class="shrink"><button onclick={() => topic.links.push({ name: 'New link', href: '', source: filename }) } title="Add link" class="transparent"><IconAddLink/></button></td>
            <td class="shrink"><button onclick={() => removeTopic(indexTopic)} title="Delete topic" class="transparent delete"><IconTrash/></button></td>
          {/if}
        </tr>
        {#each topic.links as link, indexLink (link)}
          <tr data-topic={indexTopic} data-link={indexLink}>
            {#if !isMerged}<td class="sort-handle shrink" title="Drag and drop for basic ordering"><IconDrag/></td>{/if}
            <td>
              {#if link.iconUrl}
                <!-- svelte-ignore a11y_missing_attribute -->
                <img src={link.iconUrl} height="18" aria-hidden="true"/>
              {:else if link.icon}
                <Icon icon={link.icon} size={1} />
              {/if}
            </td>
            <td>{link.name}</td>
            <td>{link.href}</td>
            <td>{link.tags?.join(', ')}</td>
            <td>{link.order}</td>
            {#if isMerged}
              <td><a href="#{link.source}.yml">{link.source}.yml</a></td>
            {:else}
              <td class="shrink">
                <button onclick={() => editedLink = { indexTopic, indexLink }} title="Edit link" class="transparent"><IconPencil/></button>
                {#if editedLink?.indexTopic === indexTopic && editedLink?.indexLink === indexLink}
                  <Modal title="Edit link" onClose={() => editedLink = null}>
                    <ConfigLink {link} {indexTopic} {indexLink} update={updateLink}/>
                  </Modal>
                {/if}
              </td>
              <td class="shrink">
                <button onclick={() => removeLink(indexTopic, indexLink)} title="Delete link" class="transparent delete"><IconTrash/></button>
              </td>
            {/if}
          </tr>
        {/each}
      {/each}
    </tbody>
  </table>
</div>
{#if !isMerged}
  {#if message}
    <Modal title={message.title} onClose={() => message = undefined}>
      <p class="is-error">{message.text}</p>
    </Modal>
  {/if}
  {#if confirmModal}
    <Modal title="Confirm" confirm={confirmModal.confirm} cancel={confirmModal.cancel} onClose={confirmModal.cancel}>
      <p class="is-error">{confirmModal.text}</p>
    </Modal>
  {/if}
  <p>
    <button onclick={() => config.topics.push({ name: 'New topic', links: [] })} title="Add a new topic">Add topic</button>
  </p>
  <details>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <summary role="button">View YAML file</summary>
    <pre class="selectable"><code>{getYamlContent()}</code></pre>
  </details>
  <p>
    <button title="Save YAML file" onclick={saveFile} disabled={isSaving}><span>Save</span><IconSave {isSaved} /></button>
  </p>
{/if}
