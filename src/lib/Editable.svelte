<script lang="ts">
  import { tick } from 'svelte'
  import IconPencil from './IconPencil.svelte'
  type ValueType = string | number | boolean

  let {
    value = $bindable(),
    tag = 'span',
    isInvalid = () => null,
    title,
    ...props
  }: {
    value: ValueType
    tag?: string
    isInvalid?: (value: ValueType) => boolean
    title?: string
    id?: string
    type?: string
    placeholder?: string
    style?: string
    size?: number
  } = $props()

  let isEditing = $state(false)
  let _value: ValueType = $state(value)
  let ref: HTMLInputElement = $state()

  const enterEdit = () => {
    isEditing = true
    tick()
      .then(() => {
        ref.focus()
        return
      })
      .catch((reason) => console.warn(reason))
  }

  const leaveEdit = () => {
    if (isInvalid(_value)) {
      return
    }
    isEditing = false
    value = _value
  }
</script>

{#if isEditing}
  <input
    bind:this={ref}
    bind:value={_value}
    {...props}
    onchange={leaveEdit}
    onblur={leaveEdit}
    aria-invalid={isInvalid(_value)} />
{:else}
  <svelte:element this={tag} class="editable">
    <span>{value}</span>
    <button class="transparent" {title} onclick={enterEdit}>
      <IconPencil />
    </button>
  </svelte:element>
{/if}
