<script lang="ts">
  import svg from '@mdi/svg/svg/content-save.svg?raw'
  import svgOk from '@mdi/svg/svg/content-save-check.svg?raw'
  let {
    isSaved = false,
  }: {
    isSaved?: boolean,
  } = $props()
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html isSaved ? svgOk : svg}
