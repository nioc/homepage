<script>
  import Icon from './Icon.svelte'
  export let href
  export let name
  export let iconUrl
  export let icon = null
  export let target = '_blank'
  export let tags = []
</script>

<a {href} class="app" title="{name} ({href})" {target}>
  {#if iconUrl}
    <!-- svelte-ignore a11y-missing-attribute -->
    <img src={iconUrl} height="36" aria-hidden="true"/>
  {:else}
    {#key icon}
      <Icon {icon} size={2} />
    {/key}
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
