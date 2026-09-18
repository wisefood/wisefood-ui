<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
      @click="emit('close')"
    />

    <div class="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
        <div class="w-8 h-8 rounded-lg bg-brandp-50 dark:bg-brandp-950/40 flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-refrigerator"
            class="w-4 h-4 text-brandp-500"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ t('foodChatHome.pantryPicker.title') }}
          </p>
          <p class="text-[0.6875rem] text-gray-400 dark:text-zinc-500 truncate">
            {{ t('foodChatHome.pantryPicker.subtitle') }}
          </p>
        </div>
        <button
          class="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          :aria-label="t('foodChatHome.pantryPicker.close')"
          @click="emit('close')"
        >
          <UIcon
            name="i-lucide-x"
            class="w-4 h-4"
          />
        </button>
      </div>

      <!-- Type anything, because a cupboard is not a list we wrote. -->
      <div class="px-4 pt-3 pb-2 border-b border-gray-100 dark:border-zinc-800">
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
            :disabled="!draft.trim()"
            @click="addTyped"
          >
            {{ t('foodChatHome.pantryPicker.add') }}
          </UButton>
        </div>
      </div>

      <!-- The grid: common things, grouped the way a kitchen is. -->
      <div class="px-4 py-3 overflow-y-auto flex-1">
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
        <div v-if="extras.length" class="mb-1">
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
      </div>

      <!-- Footer: what is selected, and the one action. -->
      <div class="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3">
        <p class="text-xs text-gray-500 dark:text-zinc-400 flex-1 min-w-0 truncate">
          <span v-if="selected.length">{{ t('foodChatHome.pantryPicker.count', selected.length) }}</span>
          <span v-else>{{ t('foodChatHome.pantryPicker.empty') }}</span>
        </p>
        <UButton
          v-if="selected.length"
          size="sm"
          color="neutral"
          variant="ghost"
          :disabled="busy"
          @click="selected = []"
        >
          {{ t('foodChatHome.pantryPicker.clear') }}
        </UButton>
        <UButton
          size="sm"
          color="primary"
          :icon="busy ? 'i-lucide-loader-2' : 'i-lucide-chef-hat'"
          :ui="{ leadingIcon: busy ? 'animate-spin' : '' }"
          :disabled="!selected.length || busy"
          @click="cook"
        >
          {{ busy ? t('foodChatHome.pantryPicker.planning') : t('foodChatHome.pantryPicker.cook') }}
        </UButton>
      </div>
    </div>
  </div>
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

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
  if (selected.value.length) emit('cook', [...selected.value])
}
</script>

<style scoped>
.fc-pantry-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
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
</style>
