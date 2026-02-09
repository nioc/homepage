<script lang="ts">
  import Icon from './Icon.svelte'
  import type { Link } from '../types/config'

  let {
    link,
  }: {
    link: Link
  } = $props()

  const {
    href,
    name,
    iconUrl,
    icon = null,
    target = '_blank',
    tags = [],
  } = link
</script>

<a {href} class="app" title="{name} ({href})" {target} rel="noreferrer">
  {#if iconUrl}
    <!-- svelte-ignore a11y_missing_attribute -->
    <img src={iconUrl} height="36" aria-hidden="true"/>
  {:else}
    <Icon {icon} size={2} />
  {/if}
  <div class="app-content">
    <h3>{name}</h3>
    {#if tags}
      <div class="tags">
        {#each tags as tag (tag)}
          <small class="tag">{tag}</small>
        {/each}
      </div>
    {/if}
  </div>
</a>
