<script lang="ts">
  import LinkComponent from '../lib/Link.svelte'
  import type { Topic } from '../types/config'
  import { sortItems } from './utils'
  let {
    displaySearch,
    topics,
  }: {
    displaySearch: boolean
    topics: Topic[]
  } = $props()

  function sortTopicsAndLinks(topics: Topic[]) {
    const _topics = structuredClone($state.snapshot(topics))
    _topics.sort(sortItems)
    _topics.forEach((topic) => topic.links.sort(sortItems))
    return _topics
  }

  let search = $state('')
  let displayedTopics = $derived(
    search === ''
      // no search, return sorted topics & links
      ? sortTopicsAndLinks(topics)
      // filter links, return sorted topics & links
      : sortTopicsAndLinks(
        topics
          .map((topic) => {
            const links = topic.links
              .filter((link) =>
                // link name matches search term
                link.name.toLowerCase().includes(search.toLowerCase()) ||
                // a tag of the link matches search term
                link.tags && link.tags.some((tag) =>
                  tag.toLowerCase().includes(search.toLowerCase()),
                ),
              )
            return { ...topic, links }
          })
          .filter((topic) => topic.links.length > 0),
      ),
  )
</script>

{#if displaySearch}
  <div>
    <input bind:value={search} type="search" placeholder="Search" />
    <button onclick={() => (search = '')} aria-label="Clear search"></button>
  </div>
{/if}

{#each displayedTopics as { name, links } (name)}
  <div class="topic">
    <h2 class="topic-name">{name}</h2>
    <div class="topic-links">
      {#each links as link (link)}
        <LinkComponent {link} />
      {/each}
    </div>
  </div>
{/each}
