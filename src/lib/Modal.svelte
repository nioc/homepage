<script module lang="ts">
  export type ConfirmModal = {
    text: string,
    confirm: () => void,
    cancel?: () => void,
  }
</script>

<script lang="ts">
  import { type Snippet } from 'svelte'
  import { portal } from 'svelte-portal'

  let {
    title,
    children,
    open = $bindable(true),
    onClose = () => {
      open = false
    },
    cancel,
    confirm,
  }: {
    title: string,
    children: Snippet,
    open?: boolean,
    onClose?: () => void,
    cancel?: () => void,
    confirm?: () => void,
  } = $props()
</script>

{#if open}
  <dialog open onclick={onClose} use:portal={'#app'}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <article onclick={(e) => {
      e.stopPropagation()
    }}>
      <header>
        {/* @ts-expect-error required for PicoCSS */ null}
        <button aria-label="Close" rel="prev" onclick={onClose}></button>
        <p><strong>{title}</strong></p>
      </header>
      {@render children()}
      {#if confirm || cancel}
        <footer>
          {#if cancel}
            <button class="secondary" onclick={cancel}>Cancel</button>
          {/if}
          {#if confirm}
            <button onclick={confirm}>Confirm</button>
          {/if}
        </footer>
      {/if}
    </article>
  </dialog>
{/if}
