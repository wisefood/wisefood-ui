<!--
  A catalog field whose legal values are either a fixed list or a list plus
  whatever the corpus already uses.

  Two controls, because the two cases are genuinely different:

  - **Closed** (`allow-custom="false"`) — the API validates against an enum, so
    anything else is a 422 that arrives after the save looks successful. Licence
    is the one that bites. A select is the honest control. An empty model is
    handed to it as `undefined`, so no value shows the placeholder rather than
    the "None" entry.
  - **Open** — a plain input with a native suggestion list. Deliberately not a
    combobox: `UInputMenu` only writes its model when an item is picked, so text
    typed and left unpicked is discarded on blur, and its search term is also
    written *back* by the control itself (on mount, and after each selection,
    with the item's label). Committing from that channel cannot distinguish the
    editor's typing from the control's own echo — it corrupted a loaded `IE`
    into `Ireland (IE)` and blanked a language nobody touched. A plain input has
    no such second writer: what is in the box is the value.
-->
<template>
  <USelectMenu
    v-if="!allowCustom"
    :model-value="modelValue || undefined"
    :items="selectItems"
    value-key="value"
    label-key="label"
    :icon="leadingIcon || undefined"
    :placeholder="placeholder"
    :disabled="disabled"
    class="w-full"
    @update:model-value="commitSelection"
  />

  <div v-else>
    <UInput
      :model-value="modelValue"
      :list="listId"
      :icon="leadingIcon || undefined"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    />
    <datalist :id="listId">
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label === option.value ? undefined : option.label }}
      </option>
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { CatalogSelectOption } from '~/utils/consoleCatalogFields'
import { withCurrentOption } from '~/utils/consoleCatalogFields'

const props = withDefaults(defineProps<{
  /*
   * Optional because several of these bind through an index signature
   * (`form[key]`), which TypeScript widens to `string | undefined`. Taking that
   * here keeps the assertion out of every call site.
   */
  modelValue?: string
  /** Known values, in the order they should be offered. */
  options?: readonly CatalogSelectOption[]
  placeholder?: string
  /** Optional icon, matching the surrounding form. */
  leadingIcon?: string
  /**
   * Whether a value outside `options` is allowed. False for a field the API
   * validates against a fixed list.
   */
  allowCustom?: boolean
  /** Whether the closed control offers a way back to no value. */
  clearable?: boolean
  disabled?: boolean
}>(), {
  modelValue: '',
  options: () => [],
  placeholder: 'Select or type a value',
  leadingIcon: '',
  allowCustom: true,
  clearable: true,
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const listId = useId()

/*
 * The way back to no value cannot be the empty string the model uses for it.
 * The select is a Reka combobox, which reserves '' for "clear the selection"
 * and throws at mount for any item that carries it — every closed field on
 * every page failed to render. The sentinel is translated at this edge and
 * never reaches the model.
 */
const NONE = '__none__'

/*
 * A closed list still has to carry the stored value: a record can hold a member
 * of the enum that the curated list no longer offers, and a select whose value
 * is absent from its items renders blank and writes that blankness back on the
 * next save. The empty entry is what makes "not established" reachable again —
 * for a licence that is a different statement from any of the values.
 */
const selectItems = computed(() => {
  const items = withCurrentOption(props.options, props.modelValue)
  return props.clearable ? [{ label: '— None —', value: NONE }, ...items] : items
})

function commitSelection(value: unknown) {
  emit('update:modelValue', value === NONE || value == null ? '' : String(value))
}
</script>
