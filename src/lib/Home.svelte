<script lang="ts">
  import LinkComponent from '../lib/Link.svelte'
  import type { Link, Topic } from '../types/config'
  let {
    displaySearch,
    topics,
  }: {
    displaySearch: boolean,
    topics: Topic[],
  } = $props()

  function sortItems (a: Topic | Link, b: Topic | Link) {
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

  function sortTopicsAndLinks (topics: Topic[]) {
    topics.sort(sortItems)
    topics.forEach((topic) => topic.links.sort(sortItems))
    return topics
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
  <input bind:value={search} type="search" placeholder="Search" />
{/if}

{#each displayedTopics as { name, links } (name)}
  <div class="topic">
    <h2 class="topic-name">{name}</h2>
    <div class="topic-links">
      {#each links as { href, name, iconUrl, icon, target, tags }, index (index)}
        <LinkComponent {href} {name} {iconUrl} {icon} {target} {tags} />
      {/each}
    </div>
  </div>
{/each}
