<script lang="ts">
  import Icon from './Icon.svelte'
  import type { Link } from '../types/config'

  let {
    link,
  }: {
    link: Link
  } = $props()
</script>

<a href={link.href} class="app" title="{link.name} ({link.href})" target={link.target} rel="noreferrer">
  {#if link.iconUrl}
    <!-- svelte-ignore a11y_missing_attribute -->
    <img src={link.iconUrl} height="36" aria-hidden="true" />
  {:else}
    <Icon icon={link.icon} size={2} />
  {/if}
  <div class="app-content">
    <h3>{link.name}</h3>
    {#if link.tags}
      <div class="tags">
        {#each link.tags as tag (tag)}
          <small class="tag">{tag}</small>
        {/each}
      </div>
    {/if}
  </div>
</a>
