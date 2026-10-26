<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { followPage, loadHelpMedia, useHelp } from '~/composables/useHelp'
import { getHelpMediaBaseUrl } from '~/utils/runtimeConfig'

/**
 * The help companion: a panel beside the page on a desktop, a sheet from the
 * bottom on a phone. Mounted once, in app.vue.
 *
 * On a desktop it is deliberately NOT a dialog. Help is read while doing the
 * thing, so the page stays usable: no backdrop, no focus trap, and from
 * 80rem up the page makes room for it (`html.wf-help-docked` pads #__nuxt)
 * instead of being covered. Between `lg` and 80rem there is no room to give,
 * so it overlays the page below the header. On a phone, where the screen is
 * the page, it is a sheet and closes itself before a tour starts.
 *
 * It follows navigation: leave it open, go somewhere else, and it explains
 * the new page.
 */
const help = useHelp()
const route = useRoute()
const { isCompact, isDesktop } = useViewport()

const ui = computed(() => help.content.value.ui)

// Media are optional and fetched only once somebody opens the panel.
const mediaBase = getHelpMediaBaseUrl()
watch(help.open, (isOpen) => {
  if (isOpen) void loadHelpMedia(mediaBase)
})

watch(() => route.path, path => followPage(path))

// --- desktop panel -----------------------------------------------------------

const panelOpen = computed(() => help.open.value && isDesktop.value)
const heading = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

watch(panelOpen, async (isOpen) => {
  document.documentElement.classList.toggle('wf-help-docked', isOpen)
  if (isOpen) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    heading.value?.focus({ preventScroll: true })
  } else if (returnFocus?.isConnected) {
    returnFocus.focus({ preventScroll: true })
    returnFocus = null
  }
}, { immediate: true })

onBeforeUnmount(() => {
  document.documentElement.classList.remove('wf-help-docked')
})

// --- phone sheet -------------------------------------------------------------

const sheetOpen = computed({
  get: () => help.open.value && isCompact.value,
  set: (value: boolean) => {
    if (!value) help.closeHelp()
  }
})

// --- keyboard ----------------------------------------------------------------

function typingInto(target: EventTarget | null): boolean {
  const el = target instanceof HTMLElement ? target : null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

// `?` anywhere outside a text field, like most help systems. Not on the
// pages that have no help and no header (maintenance, the bare auth shell).
onKeyStroke('?', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || typingInto(event.target)) return
  event.preventDefault()
  help.toggleHelp('keyboard')
})

onKeyStroke('Escape', (event) => {
  if (!panelOpen.value) return
  const panel = document.getElementById('wf-help-panel')
  if (panel && event.target instanceof Node && panel.contains(event.target)) help.closeHelp()
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="panelOpen"
        id="wf-help-panel"
        :aria-labelledby="'wf-help-panel-title'"
        class="fixed bottom-0 right-0 top-(--ui-header-height) z-40 flex w-(--wf-help-width) max-w-full flex-col border-l border-default bg-default shadow-2xl xl:top-0 xl:shadow-none"
      >
        <header class="flex h-(--ui-header-height) shrink-0 items-center justify-between gap-2 border-b border-default px-4">
          <h2
            id="wf-help-panel-title"
            ref="heading"
            tabindex="-1"
            class="flex items-center gap-2 text-base font-semibold text-highlighted outline-none"
          >
            <UIcon
              name="i-lucide-circle-help"
              class="size-5 text-brand-500"
            />
            {{ ui.title }}
          </h2>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            :aria-label="ui.close"
            @click="help.closeHelp()"
          />
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <HelpPanelContent />
        </div>
      </aside>
    </Transition>
  </Teleport>

  <UDrawer
    v-if="isCompact"
    v-model:open="sheetOpen"
    :title="ui.title"
    :ui="{
      content: 'max-h-[88dvh]',
      container: 'pb-[max(1rem,var(--wf-safe-bottom))]',
      body: 'overscroll-contain'
    }"
  >
    <template #body>
      <HelpPanelContent />
    </template>
  </UDrawer>
</template>
