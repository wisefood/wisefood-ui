<!--
  What to buy for a plan, as a checklist you can take to the shop.

  It used to be a card of grey rows above the meals, cut at 25 with a note.
  Now: every item, grouped by aisle (or by meal), each with its picture and the
  meals that need it, ticked off as it goes in the basket. Ticks are kept per
  plan in this browser, so the list survives closing the dialog mid-shop.

  FoodChat gives names, never amounts (recipes store ingredients as text), so
  the list says where the amounts are instead of inventing any.
-->
<template>
  <DefineBody>
    <div class="flex flex-col gap-4">
      <!-- How far along: a cheer, a count and a bar. -->
      <div class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-[0.9375rem] font-bold text-gray-900 dark:text-white">{{ cheer }}</span>
          <span class="text-[0.8125rem] font-semibold text-gray-500 dark:text-zinc-400 tabular-nums">
            {{ t('foodChatHome.shopping.progress', { got, total }) }}
          </span>
        </div>
        <div
          class="h-2.5 rounded-full bg-brandg-100 dark:bg-brandg-900/40 overflow-hidden"
          role="progressbar"
          :aria-valuemin="0"
          :aria-valuemax="total"
          :aria-valuenow="got"
          :aria-label="t('foodChatHome.shopping.progress', { got, total })"
        >
          <div
            class="h-full rounded-full bg-brandg-500 transition-[width] duration-300 motion-reduce:transition-none"
            :style="{ width: `${total ? Math.round(got / total * 100) : 0}%` }"
          />
        </div>
      </div>

      <div
        class="inline-flex self-start gap-0.5 p-0.5 rounded-full bg-gray-100 dark:bg-zinc-800"
        role="group"
        :aria-label="t('foodChatHome.shopping.groupBy')"
      >
        <button
          v-for="option in viewOptions"
          :key="option.value"
          type="button"
          class="h-8 px-3.5 rounded-full text-[0.8125rem] font-semibold transition-colors"
          :class="view === option.value
            ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white'"
          :aria-pressed="view === option.value"
          @click="view = option.value"
        >
          <span aria-hidden="true">{{ option.emoji }}</span> {{ option.label }}
        </button>
      </div>

      <div
        v-if="total && got === total"
        class="flex items-center gap-3 rounded-2xl bg-brandg-50 dark:bg-brandg-900/30 px-4 py-3"
      >
        <span class="text-2xl" aria-hidden="true">🎉</span>
        <span class="text-sm font-semibold text-gray-800 dark:text-zinc-100">{{ t('foodChatHome.shopping.allDone') }}</span>
      </div>

      <section
        v-for="group in groups"
        :key="group.key"
        class="flex flex-col"
      >
        <h3 class="flex items-center gap-2 px-1 pb-1 text-sm font-bold text-gray-900 dark:text-white">
          <span class="text-lg" aria-hidden="true">{{ group.emoji }}</span>
          {{ group.title }}
          <span class="text-xs font-semibold text-gray-500 dark:text-zinc-400">{{ group.count }}</span>
        </h3>
        <button
          v-for="row in group.rows"
          :key="`${group.key}:${row.name}`"
          type="button"
          role="checkbox"
          :aria-checked="row.done"
          class="flex items-center gap-3 min-h-12 px-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 focus-visible:outline-2 focus-visible:outline-brandp-500"
          @click="toggle(row.name)"
        >
          <span
            class="size-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors motion-reduce:transition-none"
            :class="row.done ? 'bg-brandg-600 border-brandg-600 text-white' : 'border-gray-300 dark:border-zinc-600'"
          >
            <UIcon
              v-if="row.done"
              name="i-lucide-check"
              class="size-3.5"
            />
          </span>
          <span
            class="w-7 shrink-0 text-center text-xl"
            :class="row.done ? 'opacity-50 grayscale' : ''"
            aria-hidden="true"
          >{{ row.emoji }}</span>
          <span
            class="flex-1 min-w-0 text-[0.9375rem] font-semibold first-letter:uppercase"
            :class="row.done ? 'text-gray-400 dark:text-zinc-500 line-through decoration-gray-300' : 'text-gray-900 dark:text-white'"
          >{{ row.name }}</span>
          <span
            v-if="row.chips.length"
            class="hidden sm:flex shrink-0 items-center gap-1"
            :class="row.done ? 'opacity-50' : ''"
          >
            <span
              v-for="tag in row.chips"
              :key="tag"
              class="rounded-full bg-brandp-50 dark:bg-brandp-950/40 px-2 py-0.5 text-[0.6875rem] font-semibold text-brandp-600 dark:text-brandp-300 whitespace-nowrap"
            >{{ tag }}</span>
          </span>
        </button>
      </section>

      <section
        v-if="kitchen.length"
        class="flex flex-col gap-2 px-1"
      >
        <h3 class="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span class="text-lg" aria-hidden="true">🏠</span>
          {{ t('foodChatHome.shopping.kitchenTitle') }}
          <span class="text-xs font-semibold text-gray-500 dark:text-zinc-400">{{ kitchen.length }}</span>
        </h3>
        <p class="text-[0.8125rem] text-gray-500 dark:text-zinc-400">
          {{ t('foodChatHome.shopping.kitchenNote') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="row in kitchen"
            :key="row.name"
            class="rounded-full bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-[0.8125rem] font-semibold text-gray-600 dark:text-zinc-300 first-letter:uppercase"
          ><span aria-hidden="true">{{ row.emoji }}</span> {{ row.name }}</span>
        </div>
      </section>

      <p class="px-1 text-xs text-gray-500 dark:text-zinc-400">
        {{ t('foodChatHome.shopping.amounts') }}
      </p>
    </div>
  </DefineBody>

  <DefineFooter>
    <div class="flex w-full items-center gap-2">
      <UButton
        color="neutral"
        variant="outline"
        class="rounded-full"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        @click="copy"
      >
        {{ copied ? t('foodChatHome.shopping.copied') : t('foodChatHome.shopping.copy') }}
      </UButton>
      <span class="flex-1" />
      <UButton
        class="rounded-full px-5 bg-brandp-500 hover:bg-brandp-600 text-white dark:bg-brandp-400 dark:hover:bg-brandp-300"
        @click="open = false"
      >
        {{ t('foodChatHome.shopping.done') }}
      </UButton>
    </div>
  </DefineFooter>

  <UDrawer
    v-if="isPhone"
    v-model:open="open"
    :title="`🧺 ${t('foodChatHome.shopping.title')}`"
    :description="subtitle"
    :ui="{
      content: 'max-h-[90dvh]',
      container: 'min-h-0 overflow-hidden gap-3 pb-[max(0.5rem,var(--wf-safe-bottom))]',
      body: 'min-h-0 overflow-y-auto -mx-4 px-4',
      footer: 'shrink-0 pt-2 border-t border-gray-100 dark:border-zinc-800'
    }"
  >
    <template #body>
      <ReuseBody />
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </UDrawer>

  <UModal
    v-else
    v-model:open="open"
    :title="`🧺 ${t('foodChatHome.shopping.title')}`"
    :description="subtitle"
    :ui="{
      content: 'max-w-xl rounded-3xl',
      title: 'text-xl font-bold',
      body: 'max-h-[min(64vh,40rem)] overflow-y-auto',
      footer: 'bg-gray-50/70 dark:bg-zinc-900/60'
    }"
  >
    <template #body>
      <ReuseBody />
    </template>
    <template #footer>
      <ReuseFooter />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createReusableTemplate } from '@vueuse/core'
import {
  AISLE_EMOJI, AISLE_ORDER, inKitchen, placeItem,
  type AisleKey, type ShoppingItem, type ShoppingUse
} from '~/utils/shoppingAisles'

const props = withDefaults(defineProps<{
  items: ShoppingItem[]
  /** How many dishes the list was gathered from. */
  dishes?: number
  /** What the ticks are remembered under: one list per plan. */
  storageKey: string
  /** What the member said is in their kitchen: shown apart, not to buy. */
  pantry?: string[]
  /** One use of an item, in the reader's words ("Mon · Dinner"). */
  useLabel: (use: ShoppingUse) => string
}>(), {
  dishes: 0,
  pantry: () => []
})

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()
const { isPhone } = useViewport()
const [DefineBody, ReuseBody] = createReusableTemplate()
const [DefineFooter, ReuseFooter] = createReusableTemplate()

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🍳', brunch: '🥞', lunch: '🥗', dinner: '🍲', snack: '🍎', dessert: '🍰'
}
const MEAL_ORDER = ['breakfast', 'brunch', 'lunch', 'snack', 'dinner', 'dessert']

const view = ref<'aisle' | 'meal'>('aisle')
const viewOptions = computed(() => [
  { value: 'aisle' as const, emoji: '🛒', label: t('foodChatHome.shopping.byAisle') },
  { value: 'meal' as const, emoji: '🍽️', label: t('foodChatHome.shopping.byMeal') }
])

// ── ticks, kept per plan ─────────────────────────────────────────────────
const ticked = ref<Set<string>>(new Set())
const storage = computed(() => `foodchat:shopping:${props.storageKey}`)

function load() {
  try {
    const raw = localStorage.getItem(storage.value)
    ticked.value = new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    ticked.value = new Set()
  }
}
function save() {
  try {
    localStorage.setItem(storage.value, JSON.stringify([...ticked.value]))
  } catch { /* private mode: ticks last as long as the dialog */ }
}
watch(() => [open.value, storage.value], ([isOpen]) => {
  if (isOpen) load()
}, { immediate: true })

function toggle(name: string) {
  const next = new Set(ticked.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  ticked.value = next
  save()
}

// ── the rows ─────────────────────────────────────────────────────────────
interface Row {
  name: string
  emoji: string
  aisle: AisleKey
  uses: ShoppingUse[]
  chips: string[]
  done: boolean
}

function chip(use: ShoppingUse): string {
  const emoji = MEAL_EMOJI[String(use.meal_type || '').toLowerCase()] ?? '🍽️'
  return `${emoji} ${props.useLabel(use)}`
}

const rows = computed<Row[]>(() => props.items
  .filter(entry => entry?.item)
  .map((entry) => {
    const name = String(entry.item)
    const placed = placeItem(name)
    const uses = entry.uses ?? []
    const chips = uses.length > 2
      ? [t('foodChatHome.shopping.forMeals', { count: uses.length })]
      : uses.map(chip)
    return { name, ...placed, uses, chips, done: ticked.value.has(name) }
  }))

const kitchen = computed(() => rows.value.filter(row => inKitchen(row.name, props.pantry)))
const toBuy = computed(() => rows.value.filter(row => !inKitchen(row.name, props.pantry)))

const total = computed(() => toBuy.value.length)
const got = computed(() => toBuy.value.filter(row => row.done).length)

const subtitle = computed(() => t('foodChatHome.shopping.subtitle', { items: total.value, dishes: props.dishes }))

const cheer = computed(() => {
  if (!total.value || got.value === 0) return t('foodChatHome.shopping.cheer.ready')
  if (got.value === total.value) return t('foodChatHome.shopping.cheer.done')
  return got.value / total.value >= 0.6
    ? t('foodChatHome.shopping.cheer.almost')
    : t('foodChatHome.shopping.cheer.start')
})

interface Group {
  key: string
  emoji: string
  title: string
  count: string
  rows: Row[]
}

const groups = computed<Group[]>(() => {
  if (view.value === 'aisle') {
    return AISLE_ORDER
      .map((aisle) => {
        const inAisle = toBuy.value.filter(row => row.aisle === aisle)
        return {
          key: aisle,
          emoji: AISLE_EMOJI[aisle],
          title: t(`foodChatHome.shopping.aisles.${aisle}`),
          count: t('foodChatHome.shopping.toGet', { count: inAisle.filter(row => !row.done).length }),
          rows: inAisle
        }
      })
      .filter(group => group.rows.length)
  }
  // By meal: each item under every meal that uses it, in the order the plan runs.
  const byMeal = new Map<string, { use: ShoppingUse, rows: Row[] }>()
  for (const row of toBuy.value) {
    for (const use of row.uses) {
      const key = `${use.day ?? 0}:${String(use.meal_type || '')}`
      const entry = byMeal.get(key) ?? { use, rows: [] }
      entry.rows.push({ ...row, chips: [] })
      byMeal.set(key, entry)
    }
  }
  const rank = (use: ShoppingUse) => {
    const meal = MEAL_ORDER.indexOf(String(use.meal_type || '').toLowerCase())
    return (use.day ?? 0) * 100 + (meal < 0 ? 50 : meal)
  }
  return [...byMeal.entries()]
    .sort(([, a], [, b]) => rank(a.use) - rank(b.use))
    .map(([key, entry]) => ({
      key,
      emoji: MEAL_EMOJI[String(entry.use.meal_type || '').toLowerCase()] ?? '🍽️',
      title: props.useLabel(entry.use),
      count: t('foodChatHome.shopping.things', { count: entry.rows.length }),
      rows: entry.rows
    }))
})

// ── copy, for a notes app or a message ───────────────────────────────────
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  // What is still to get, by aisle: the list someone actually shops from.
  const lines: string[] = [`🧺 ${t('foodChatHome.shopping.title')}`]
  for (const aisle of AISLE_ORDER) {
    const left = toBuy.value.filter(row => row.aisle === aisle && !row.done)
    if (!left.length) continue
    lines.push('', `${AISLE_EMOJI[aisle]} ${t(`foodChatHome.shopping.aisles.${aisle}`)}`)
    for (const row of left) lines.push(`- ${row.name}`)
  }
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.add({ title: t('foodChatHome.shopping.copyFailed'), color: 'warning' })
  }
}
</script>
