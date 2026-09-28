<template>
  <!--
    One picker, two shells.

    On a phone it is a bottom sheet: the grid is where the thumb already is,
    the footer with the one action stays put above the keyboard, and the
    primitive owns Escape, the scroll lock and the swipe to dismiss. Wider
    than a phone it is a centred dialog. The hand-rolled overlay it replaces
    had none of that: no scroll lock, no Escape, and a footer the keyboard
    pushed off the bottom of the screen.

    The parent still mounts this with `v-if` and listens for `close`, so the
    sheet asks to close first and reports it once it has slid away.
  -->
  <DefineSearch>
    <!-- Type anything, because a cupboard is not a list we wrote. -->
    <div class="flex items-center gap-2">
      <UInput
        v-model="draft"
        icon="i-lucide-search"
        size="sm"
        class="flex-1"
        :placeholder="t('foodChatHome.pantryPicker.searchPlaceholder')"
        :aria-label="t('foodChatHome.pantryPicker.searchPlaceholder')"
        @keydown.enter.prevent="addTyped"
      />
      <UButton
        size="sm"
        color="neutral"
        variant="subtle"
        icon="i-lucide-plus"
        class="pointer-coarse:min-h-11"
        :disabled="!draft.trim()"
        @click="addTyped"
      >
        {{ t('foodChatHome.pantryPicker.add') }}
      </UButton>
    </div>
  </DefineSearch>

  <DefineGrid>
    <!-- The grid: common things, grouped the way a kitchen is. -->
    <div
      v-for="group in visibleGroups"
      :key="group.key"
      class="mb-4 last:mb-0"
    >
      <p class="text-[0.625rem] uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1.5">
        {{ t(`foodChatHome.pantryPicker.groups.${group.key}`) }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="item in group.items"
          :key="item"
          type="button"
          class="fc-pantry-chip"
          :class="isSelected(item) ? 'fc-pantry-chip--on' : ''"
          :aria-pressed="isSelected(item)"
          @click="toggle(item)"
        >
          <UIcon
            v-if="isSelected(item)"
            name="i-lucide-check"
            class="w-3 h-3 shrink-0"
          />
          {{ item }}
        </button>
      </div>
    </div>

    <!-- Anything typed that is not on the grid still belongs to the member. -->
    <div v-if="extras.length" class="mt-4">
      <p class="text-[0.625rem] uppercase tracking-wide text-gray-400 dark:text-zinc-500 mb-1.5">
        {{ t('foodChatHome.pantryPicker.groups.yours') }}
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="item in extras"
          :key="item"
          type="button"
          class="fc-pantry-chip fc-pantry-chip--on"
          :aria-pressed="true"
          @click="toggle(item)"
        >
          <UIcon name="i-lucide-check" class="w-3 h-3 shrink-0" />
          {{ item }}
        </button>
      </div>
    </div>

    <p
      v-if="!visibleGroups.length && !extras.length"
      class="text-xs text-gray-400 dark:text-zinc-500 py-6 text-center"
    >
      {{ t('foodChatHome.pantryPicker.noMatches', { query: draft.trim() }) }}
    </p>
  </DefineGrid>

  <DefineFooter>
    <!-- What is selected, and the one action. -->
    <p class="text-xs text-gray-500 dark:text-zinc-400 flex-1 min-w-0 truncate">
      <span v-if="selected.length">{{ t('foodChatHome.pantryPicker.count', selected.length) }}</span>
      <span v-else>{{ t('foodChatHome.pantryPicker.empty') }}</span>
    </p>
    <UButton
      v-if="selected.length"
      size="sm"
      color="neutral"
      variant="ghost"
      class="pointer-coarse:min-h-11"
      :disabled="busy"
      @click="selected = []"
    >
      {{ t('foodChatHome.pantryPicker.clear') }}
    </UButton>
    <UButton
      size="sm"
      color="primary"
      class="pointer-coarse:min-h-11"
      :icon="busy ? 'i-lucide-loader-2' : 'i-lucide-chef-hat'"
      :ui="{ leadingIcon: busy ? 'animate-spin' : '' }"
      :disabled="!selected.length || busy"
      @click="cook"
    >
      {{ busy ? t('foodChatHome.pantryPicker.planning') : t('foodChatHome.pantryPicker.cook') }}
    </UButton>
  </DefineFooter>

  <UDrawer
    v-if="isPhone"
    v-model:open="open"
    :title="t('foodChatHome.pantryPicker.title')"
    :description="t('foodChatHome.pantryPicker.subtitle')"
    :ui="{
      content: 'max-h-[88dvh]',
      container: 'min-h-0 overflow-hidden gap-3 pb-[max(1rem,var(--wf-safe-bottom))]',
      body: 'flex min-h-0 flex-col',
      footer: 'shrink-0 flex-row items-center gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800'
    }"
    @animation-end="onDrawerAnimationEnd"
  >
    <template #body>
      <div class="flex min-h-0 flex-1 flex-col gap-3">
        <ReuseSearch />
        <div class="min-h-0 flex-1 overflow-y-auto -mx-4 px-4 pb-1">
          <ReuseGrid />
        </div>
      </div>
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </UDrawer>

  <UModal
    v-else
    v-model:open="open"
    :title="t('foodChatHome.pantryPicker.title')"
    :description="t('foodChatHome.pantryPicker.subtitle')"
    :ui="{
      content: 'max-w-2xl',
      body: 'flex min-h-0 flex-col overflow-hidden p-0 sm:p-0',
      footer: 'gap-3'
    }"
    @after:leave="finishClose"
  >
    <template #body>
      <div class="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-zinc-800 shrink-0">
        <ReuseSearch />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <ReuseGrid />
      </div>
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </UModal>
</template>

<script setup lang="ts">
/**
 * Pick what is in the kitchen, and plan from it.
 *
 * The same shape as the draft flow: stage choices, then one action turns them
 * into a plan. What is staged here is INGREDIENTS rather than recipes, which is
 * the whole difference — "I have these three things going off" is a different
 * request from "I want this dish".
 *
 * The grid is a starting point, never the vocabulary. A cupboard is not a list
 * we wrote, so anything typed is kept exactly as typed and shown under "yours"
 * — FoodChat matches pantry items against recipe ingredient text by stem, so a
 * word we never thought of works as well as one we did.
 *
 * Ingredient names stay in English in every locale, deliberately. They are
 * matched against an English corpus and they sit beside recipe titles that are
 * also English; translating the chip while the dish it matches stays in English
 * would be a label that cannot be trusted to mean what it matches. The chrome
 * around them is translated.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createReusableTemplate } from '@vueuse/core'

const props = defineProps<{
  /** What is already standing, so the picker opens on the member's own state. */
  items?: string[]
  busy?: boolean
}>()

const emit = defineEmits<{
  close: []
  /** Replace the pantry with exactly these, then plan from them. */
  cook: [items: string[]]
}>()

const { t } = useI18n()
const { isPhone } = useViewport()

const [DefineSearch, ReuseSearch] = createReusableTemplate()
const [DefineGrid, ReuseGrid] = createReusableTemplate()
const [DefineFooter, ReuseFooter] = createReusableTemplate()

/**
 * Open from the moment it is mounted; the parent decides WHEN it exists.
 *
 * Closing is a hand-off: the primitive animates out first, then `close` tells
 * the parent to unmount this. Emitting on the first `update:open` would cut
 * the animation and, on a phone, could leave the body pinned where the sheet
 * had pinned it. The timer covers a browser that never fires the end event.
 */
const open = ref(true)
let closed = false
let closeTimer: ReturnType<typeof setTimeout> | null = null

watch(open, (isOpen) => {
  if (isOpen || closed) return
  closeTimer = setTimeout(finishClose, 450)
})

function finishClose() {
  if (closed) return
  closed = true
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = null
  emit('close')
}

function onDrawerAnimationEnd(isOpen: boolean) {
  if (!isOpen) finishClose()
}

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})

const selected = ref<string[]>([...(props.items ?? [])])
const draft = ref('')

/**
 * Common things, grouped the way a kitchen is rather than the way a corpus is.
 *
 * Short on purpose. This is the shelf a member scans in two seconds before
 * typing the thing they actually have; a complete ingredient list would be a
 * database browser, and the search box already covers everything else.
 */
const GROUPS: { key: string, items: string[] }[] = [
  { key: 'vegetables', items: ['tomatoes', 'onions', 'garlic', 'potatoes', 'carrots', 'peppers', 'courgette', 'aubergine', 'mushrooms', 'spinach', 'broccoli', 'cabbage'] },
  { key: 'protein', items: ['chicken', 'beef mince', 'pork', 'salmon', 'tuna', 'eggs', 'chickpeas', 'lentils', 'black beans', 'tofu'] },
  { key: 'dairy', items: ['milk', 'butter', 'cheddar', 'feta', 'parmesan', 'yoghurt', 'cream'] },
  { key: 'grains', items: ['rice', 'pasta', 'bread', 'oats', 'couscous', 'tortillas', 'noodles', 'quinoa'] },
  { key: 'cupboard', items: ['olive oil', 'tinned tomatoes', 'stock', 'soy sauce', 'honey', 'peanut butter', 'coconut milk', 'flour'] },
  { key: 'fruit', items: ['lemons', 'apples', 'bananas', 'oranges', 'berries', 'avocado'] },
  { key: 'herbs', items: ['basil', 'parsley', 'coriander', 'thyme', 'chilli', 'ginger', 'cumin', 'paprika'] },
]

function norm(value: string): string {
  return value.trim().toLowerCase()
}

const query = computed(() => norm(draft.value))

/** The grid, narrowed by whatever is being typed. */
const visibleGroups = computed(() => {
  if (!query.value) return GROUPS
  return GROUPS
    .map(group => ({
      key: group.key,
      items: group.items.filter(item => item.includes(query.value)),
    }))
    .filter(group => group.items.length > 0)
})

/** Selected things the grid does not know about — the member's own words. */
const extras = computed(() => {
  const known = new Set(GROUPS.flatMap(group => group.items))
  return selected.value.filter(item => !known.has(item))
})

function isSelected(item: string): boolean {
  return selected.value.some(value => norm(value) === norm(item))
}

function toggle(item: string) {
  if (isSelected(item)) {
    selected.value = selected.value.filter(value => norm(value) !== norm(item))
    return
  }
  selected.value = [...selected.value, item]
}

/**
 * "feta, basil" and "feta" both work — a comma is how people list things, and
 * the strip above the composer already splits the same way.
 */
function addTyped() {
  const items = draft.value.split(',').map(part => part.trim()).filter(Boolean)
  if (!items.length) return
  for (const item of items) {
    if (!isSelected(item)) selected.value = [...selected.value, item]
  }
  draft.value = ''
}

function cook() {
  // Anything half-typed counts: a member who types "feta" and hits the button
  // meant the feta, and losing it to an unpressed Enter is the kind of thing
  // nobody reports and everybody notices.
  addTyped()
  if (!selected.value.length) return
  // The parent unmounts this on `cook`, so the sheet is released first: the
  // scroll lock is undone on the way to closed, not on unmount.
  closed = true
  open.value = false
  emit('cook', [...selected.value])
}
</script>

<style scoped>
.fc-pantry-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  min-height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid rgb(229 231 235);
  background: white;
  font-size: 0.75rem;
  line-height: 1rem;
  color: rgb(55 65 81);
  transition: background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.fc-pantry-chip:hover {
  border-color: rgb(209 213 219);
  background: rgb(249 250 251);
}
.fc-pantry-chip--on,
.fc-pantry-chip--on:hover {
  border-color: var(--color-brandp-400, rgb(167 139 250));
  background: var(--color-brandp-50, rgb(245 243 255));
  color: var(--color-brandp-700, rgb(109 40 217));
}
.dark .fc-pantry-chip {
  border-color: rgb(63 63 70);
  background: rgb(24 24 27);
  color: rgb(212 212 216);
}
.dark .fc-pantry-chip:hover {
  border-color: rgb(82 82 91);
  background: rgb(39 39 42);
}
.dark .fc-pantry-chip--on,
.dark .fc-pantry-chip--on:hover {
  border-color: var(--color-brandp-600, rgb(124 58 237));
  background: color-mix(in oklab, var(--color-brandp-500, rgb(139 92 246)) 18%, transparent);
  color: var(--color-brandp-200, rgb(221 214 254));
}
/* A chip is the whole target on a phone, so it is tall enough to land on. */
@media (pointer: coarse) {
  .fc-pantry-chip {
    min-height: 2.5rem;
    padding-inline: 0.85rem;
    font-size: 0.8125rem;
  }
}
</style>
