<template>
  <!--
    The filter panel of a results page, in the place the screen has for it.

    On a wide screen it is a column beside the results, sliding in from the
    left. Below `lg` a column would sit above the results and push them
    below the fold, with the button that closes it further down still; the
    same panel opens as a bottom sheet instead, and its one button says how
    many results the filters currently give before it closes the sheet.
    The panel is passed as the default slot so each page keeps its own
    controls and state; only the housing changes.
  -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-300 ease-in"
    enter-from-class="opacity-0 -translate-x-full"
    enter-to-class="opacity-100 translate-x-0"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 -translate-x-full"
  >
    <aside
      v-if="open && !isCompact"
      class="w-full shrink-0 lg:self-start"
      :class="asideClass"
    >
      <slot />
    </aside>
  </Transition>

  <UDrawer
    :open="open && isCompact"
    :title="title || t('foodScholarCatalog.filters.title')"
    :ui="drawerUi"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <slot />
    </template>
    <template #footer>
      <UButton
        color="primary"
        size="lg"
        block
        @click="emit('update:open', false)"
      >
        {{ t('foodScholarCatalog.filters.showResults', { count: resultCount.toLocaleString() }) }}
      </UButton>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(defineProps<{
  /** Whether the panel is showing, as a column or as a sheet. */
  open: boolean
  /** The count the sheet's button reports. */
  resultCount: number
  /** The sheet's title. Defaults to "Filters". */
  title?: string
  /** The column's width classes, for example `lg:w-80`. */
  asideClass?: string
}>(), {
  title: '',
  asideClass: 'lg:w-80'
})

const emit = defineEmits<{ 'update:open': [open: boolean] }>()

const { t } = useI18n()
const { isCompact } = useViewport()

// The body scrolls on its own so the button stays in reach at the bottom of
// the sheet however long the facet lists get, and the sheet clears the
// home indicator on phones that have one.
const drawerUi = {
  content: 'max-h-[85dvh]',
  container: 'min-h-0 gap-3 overflow-hidden',
  body: 'min-h-0 overflow-y-auto -mx-4 px-4',
  footer: 'shrink-0 pb-(--wf-safe-bottom)'
}
</script>
