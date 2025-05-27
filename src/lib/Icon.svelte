<script>
  import { onMount } from 'svelte'
  import defaultIcon from '../assets/defaultIcon.svg?raw'

  export let icon
  export let size = 1

  let isReady = false
  let svgElement
  const svgSize = (18 * size).toString()

  onMount(async () => {
    try {
      const parser = new DOMParser()
      let svgDoc
      if (icon === '') {
        svgDoc = parser.parseFromString(defaultIcon, 'image/svg+xml')
      } else {
        const svgText = await (await fetch(`icons/${icon}.svg`)).text()
        svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
        if (svgDoc.querySelector('parsererror')) {
          svgDoc = parser.parseFromString(defaultIcon, 'image/svg+xml')
          console.warn(`Unknown icon "${icon}"`)
        }
      }
      svgElement = svgDoc.documentElement
      svgElement.setAttribute('width', svgSize)
      svgElement.setAttribute('height', svgSize)
      svgElement.setAttribute('aria-hidden', 'true')
      isReady = true
    } catch (error) {
      console.error(error)
    }
  })
</script>

{#if isReady}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html svgElement.outerHTML}
{:else}
  <svg width="{svgSize}" height="{svgSize}" />
{/if}
