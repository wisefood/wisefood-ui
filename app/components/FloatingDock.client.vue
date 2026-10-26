<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { useAccessibilityStore } from '@/stores/accessibility'
import { dockRequest, useHelp } from '~/composables/useHelp'
import { useTroubleSignal } from '~/composables/useTroubleSignal'

/**
 * The floating controls every page carries: accessibility, feedback and
 * (when Sentry is on) a bug report.
 *
 * On a desktop they are the three corner buttons they always were. Below
 * `lg` a phone has one bottom corner to spare, so they fold into a single
 * button that opens a short speed-dial, and each panel opens as a bottom
 * sheet rather than a card the keyboard would push off the screen.
 *
 * Everything sits at z-30, under modals, and hides altogether while any
 * dialog is open — a fixed button above a modal's footer is a button over
 * the modal's Save. It also clears the safe area on a notched phone, and a
 * page whose bottom edge belongs to a composer lifts it with
 * `definePageMeta({ dock: 'raised' })`.
 *
 * Teleported to <body> and marked `.a11y-toolbar-root` so the grayscale mode
 * (a `filter` on #__nuxt, which would re-anchor anything fixed inside it) and
 * the high-contrast mode leave the controls alone.
 *
 * Two more jobs since the help companion:
 *
 * - On a phone the speed-dial's first item opens the help for the page (the
 *   header carries the button on a desktop), and the dial wears a dot until
 *   this page's help has been seen once. The right-hand buttons move over by
 *   `--wf-help-offset` while the desktop panel is docked.
 * - When the platform fails in a way that is ours (see useTroubleSignal), a
 *   bubble beside the bug button offers the report there and then, stamped
 *   with what failed. It only appears where the report form exists.
 */
const props = defineProps<{
  /** Accessibility only. The maintenance page has no API to give feedback to. */
  minimal?: boolean
}>()

const { t } = useI18n()
const route = useRoute()
const a11y = useAccessibilityStore()
const { isCompact } = useViewport()
const overlayOpen = useOverlayOpen()
const sentry = useSentryFeedback()
const help = useHelp()
const { trouble, report: troubleReported, dismiss: dismissTrouble, clear: clearTrouble } = useTroubleSignal()

const a11yOpen = ref(false)
const feedbackOpen = ref(false)
const dialOpen = ref(false)

onMounted(() => {
  a11y.apply()
})

const showFeedback = computed(() => !props.minimal)
const showBug = computed(() => !props.minimal && sentry.enabled.value)
const showHelp = computed(() => !props.minimal && Boolean(help.pageTopic.value))

const dockMode = computed(() => route.meta.dock ?? 'default')
const hidden = computed(() => dockMode.value === 'hidden' || overlayOpen.value)
const dockBottom = computed(() =>
  dockMode.value === 'raised'
    ? 'calc(5.75rem + var(--wf-safe-bottom))'
    : 'calc(1.25rem + var(--wf-safe-bottom))'
)

// Panels are exclusive; the dial folds once something is chosen.
function openA11y() {
  dialOpen.value = false
  feedbackOpen.value = false
  a11yOpen.value = !a11yOpen.value
}
function openFeedback() {
  dialOpen.value = false
  a11yOpen.value = false
  feedbackOpen.value = !feedbackOpen.value
}
function openBug() {
  dialOpen.value = false
  a11yOpen.value = false
  feedbackOpen.value = false
  sentry.open()
}
function openHelp() {
  dialOpen.value = false
  a11yOpen.value = false
  feedbackOpen.value = false
  help.openHelp({ via: 'dock' })
}

// The help panel's "Send feedback" lands here, on the dock's own panel.
watch(dockRequest, (request) => {
  if (request?.panel !== 'feedback' || !showFeedback.value) return
  dialOpen.value = false
  a11yOpen.value = false
  feedbackOpen.value = true
})

// --- the "something broke" bubble --------------------------------------------

/** Long enough to read and decide; a bubble that never leaves is nagging. */
const TROUBLE_VISIBLE_MS = 45_000

const troubleShown = computed(() =>
  Boolean(trouble.value) && showBug.value && !hidden.value
  && !a11yOpen.value && !feedbackOpen.value && !dialOpen.value
)
const troubleTitle = computed(() => (trouble.value ? t(`dock.trouble.${trouble.value.kind}`) : ''))

let troubleTimer: ReturnType<typeof setTimeout> | null = null
watch(trouble, (next) => {
  if (troubleTimer) clearTimeout(troubleTimer)
  troubleTimer = null
  if (!next) return
  // Nowhere to send a report on this build: nothing to offer.
  if (!showBug.value) {
    clearTrouble()
    return
  }
  troubleTimer = setTimeout(clearTrouble, TROUBLE_VISIBLE_MS)
})

function reportTrouble() {
  const current = trouble.value
  troubleReported()
  dialOpen.value = false
  if (!current) return
  sentry.open({
    source: 'nudge',
    trouble_kind: current.kind,
    trouble_page: current.page,
    ...(current.status ? { trouble_status: current.status } : {}),
    ...(current.request ? { trouble_request: current.request } : {})
  })
}
function pressDial() {
  if (props.minimal) {
    openA11y()
    return
  }
  dialOpen.value = !dialOpen.value
}

// Leaving a page closes whatever was open on it.
watch(() => route.fullPath, () => {
  dialOpen.value = false
  a11yOpen.value = false
  feedbackOpen.value = false
})

// Desktop cards close on an outside click, like the dropdowns do; the
// triggers are excluded so a click on one toggles rather than closing and
// reopening.
const a11yTrigger = ref<HTMLElement | null>(null)
const a11yCard = ref<HTMLElement | null>(null)
const feedbackTrigger = ref<HTMLElement | null>(null)
const feedbackCard = ref<HTMLElement | null>(null)
const dial = ref<HTMLElement | null>(null)

onClickOutside(a11yCard, () => { a11yOpen.value = false }, { ignore: [a11yTrigger] })
onClickOutside(feedbackCard, () => { feedbackOpen.value = false }, { ignore: [feedbackTrigger] })
onClickOutside(dial, () => { dialOpen.value = false })
onKeyStroke('Escape', () => {
  dialOpen.value = false
  if (!isCompact.value) {
    a11yOpen.value = false
    feedbackOpen.value = false
  }
})

const dialItems = computed(() => [
  { id: 'help', icon: 'i-lucide-circle-help', label: t('dock.help'), action: openHelp, show: showHelp.value },
  { id: 'a11y', icon: 'i-lucide-person-standing', label: t('a11y.title'), action: openA11y, show: true },
  { id: 'feedback', icon: 'i-lucide-smile', label: t('feedback.open'), action: openFeedback, show: showFeedback.value },
  { id: 'bug', icon: 'i-lucide-bug', label: t('dock.reportBug'), action: openBug, show: showBug.value }
].filter(item => item.show))

const fabClass = 'rounded-full shadow-lg shadow-brand-500/25 hover:shadow-brand-500/35 hover:scale-105 transition-transform'
const cardClass = 'fixed z-30 w-80 max-w-[calc(100vw-3rem)] max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-xl shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 p-5'
</script>

<template>
  <Teleport to="body">
    <div
      v-show="!hidden"
      class="a11y-toolbar-root wf-dock"
      data-wf-dock
      :style="{ '--wf-dock-bottom': dockBottom }"
    >
      <!-- Desktop: the three corner buttons. -->
      <template v-if="!isCompact">
        <div ref="a11yTrigger" class="fixed left-5 bottom-(--wf-dock-bottom) z-30">
          <UButton
            :aria-label="t('a11y.open')"
            :title="t('a11y.open')"
            :aria-expanded="a11yOpen"
            color="primary"
            variant="solid"
            icon="i-lucide-person-standing"
            size="lg"
            :class="fabClass"
            @click="openA11y"
          />
        </div>

        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-2"
        >
          <div
            v-if="a11yOpen"
            ref="a11yCard"
            role="dialog"
            :aria-label="t('a11y.title')"
            :class="cardClass"
            class="left-5 bottom-[calc(var(--wf-dock-bottom)+4rem)]"
          >
            <DockAccessibilityPanel @close="a11yOpen = false" />
          </div>
        </Transition>

        <div
          v-if="showFeedback"
          ref="feedbackTrigger"
          class="fixed right-[calc(1.25rem+var(--wf-help-offset,0px))] z-30"
          :class="showBug ? 'bottom-[calc(var(--wf-dock-bottom)+3.75rem)]' : 'bottom-(--wf-dock-bottom)'"
        >
          <UButton
            :aria-label="t('feedback.open')"
            :title="t('feedback.open')"
            :aria-expanded="feedbackOpen"
            color="primary"
            variant="solid"
            icon="i-lucide-smile"
            size="lg"
            :class="fabClass"
            @click="openFeedback"
          />
        </div>

        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-2"
        >
          <div
            v-if="feedbackOpen"
            ref="feedbackCard"
            role="dialog"
            :aria-label="t('feedback.title')"
            :class="[cardClass, showBug ? 'bottom-[calc(var(--wf-dock-bottom)+7.75rem)]' : 'bottom-[calc(var(--wf-dock-bottom)+4rem)]']"
            class="right-[calc(1.25rem+var(--wf-help-offset,0px))]"
          >
            <DockFeedbackPanel @close="feedbackOpen = false" />
          </div>
        </Transition>

        <div v-if="showBug" class="fixed right-[calc(1.25rem+var(--wf-help-offset,0px))] bottom-(--wf-dock-bottom) z-30">
          <!-- A ring that pulses while the bubble beside it is up, so the
               offer and the button it belongs to read as one thing. -->
          <span
            v-if="troubleShown"
            class="pointer-events-none absolute inset-0 rounded-full bg-brand-500/40 animate-ping motion-reduce:animate-none"
            aria-hidden="true"
          />
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            icon="i-lucide-bug"
            :class="fabClass"
            :aria-label="t('dock.reportBug')"
            :title="t('dock.reportBug')"
            @click="openBug"
          />
        </div>
      </template>

      <!-- Phones and portrait tablets: one button, a speed-dial, bottom sheets. -->
      <template v-else>
        <!-- The button steps aside while one of its own sheets is up: the sheet
             has a close button and a handle, and a round button over the
             sheet's last row is a button over its Reset. -->
        <div
          v-show="!a11yOpen && !feedbackOpen"
          ref="dial"
          class="fixed right-4 bottom-(--wf-dock-bottom) z-30 flex flex-col items-end"
        >
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="dialOpen"
              role="menu"
              :aria-label="t('dock.open')"
              class="mb-3 flex flex-col items-end gap-2"
            >
              <button
                v-for="item in dialItems"
                :key="item.id"
                type="button"
                role="menuitem"
                class="flex items-center gap-3 min-h-11 rounded-full bg-white dark:bg-zinc-900 text-sm font-medium text-gray-800 dark:text-gray-100 ring-1 ring-gray-200 dark:ring-zinc-700 shadow-lg pl-4 pr-1.5 py-1.5"
                @click="item.action"
              >
                <span>{{ item.label }}</span>
                <span class="flex size-8 items-center justify-center rounded-full bg-brand-500 text-white">
                  <UIcon :name="item.icon" class="size-4" />
                </span>
              </button>
            </div>
          </Transition>

          <UButton
            :aria-label="minimal ? t('a11y.open') : (dialOpen ? t('dock.close') : t('dock.open'))"
            :aria-expanded="minimal ? a11yOpen : dialOpen"
            :aria-haspopup="minimal ? 'dialog' : 'menu'"
            color="primary"
            variant="solid"
            :icon="minimal ? 'i-lucide-person-standing' : (dialOpen ? 'i-lucide-x' : 'i-lucide-life-buoy')"
            size="xl"
            class="size-12 justify-center"
            :class="fabClass"
            @click="pressDial"
          />
          <!-- This page's help has not been opened yet. -->
          <span
            v-if="showHelp && help.unseen.value && !dialOpen"
            class="pointer-events-none absolute right-0 top-0 size-3 rounded-full bg-amber-400 ring-2 ring-white dark:ring-zinc-900"
            aria-hidden="true"
          />
          <span
            v-if="troubleShown"
            class="pointer-events-none absolute bottom-0 right-0 size-12 rounded-full bg-brand-500/40 animate-ping motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>

        <UDrawer
          v-model:open="a11yOpen"
          :title="t('a11y.title')"
          :ui="{ content: 'a11y-toolbar-root', container: 'pb-[max(1rem,var(--wf-safe-bottom))]', header: 'sr-only' }"
        >
          <template #body>
            <DockAccessibilityPanel @close="a11yOpen = false" />
          </template>
        </UDrawer>

        <UDrawer
          v-if="showFeedback"
          v-model:open="feedbackOpen"
          :title="t('feedback.title')"
          :ui="{ content: 'a11y-toolbar-root', container: 'pb-[max(1rem,var(--wf-safe-bottom))]', header: 'sr-only' }"
        >
          <template #body>
            <DockFeedbackPanel @close="feedbackOpen = false" />
          </template>
        </UDrawer>
      </template>

      <!-- "Something broke": the offer to report it, beside the bug button on
           a desktop and beside the dial on a phone. A status, not an alert:
           it is announced without taking focus from whatever failed. -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-2"
      >
        <div
          v-if="troubleShown"
          role="status"
          aria-live="polite"
          class="fixed z-30 w-80 max-w-[calc(100vw-6.5rem)] rounded-xl bg-white p-4 shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
          :class="isCompact
            ? 'right-[5rem] bottom-(--wf-dock-bottom)'
            : 'right-[calc(5rem+var(--wf-help-offset,0px))] bottom-(--wf-dock-bottom)'"
        >
          <div class="flex gap-3">
            <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <UIcon
                name="i-lucide-bug"
                class="size-4"
              />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ troubleTitle }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {{ t('dock.trouble.body') }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <UButton
                  size="sm"
                  color="primary"
                  icon="i-lucide-send"
                  @click="reportTrouble"
                >
                  {{ t('dock.trouble.report') }}
                </UButton>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  @click="dismissTrouble"
                >
                  {{ t('dock.trouble.dismiss') }}
                </UButton>
              </div>
            </div>
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              class="-mr-1 -mt-1 self-start"
              :aria-label="t('dock.close')"
              @click="dismissTrouble"
            />
          </div>
          <!-- The tail, pointing at the button it belongs to. -->
          <span
            class="absolute -right-1.5 bottom-5 size-3 rotate-45 border-r border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            aria-hidden="true"
          />
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
