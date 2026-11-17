<template>
  <!-- One meal, led by its picture.
       The card used to be a heading row, a small round photo, two lines of
       chips, a nutrient donut and a small "Swap" box: a lot to read before
       knowing what the meal is. Now the photo says what it is, one line says
       how much, and Swap says what you want instead. Carbs and fat are a hover
       away; the meal's full numbers are in the day's bar under the cards. -->
  <article
    class="relative flex flex-col min-w-0 rounded-[1.375rem] border border-gray-200/80 dark:border-zinc-700/70 bg-white dark:bg-zinc-800/60"
    :aria-label="type"
  >
    <!-- The photo, with the meal and its time on it -->
    <div class="relative h-36 rounded-t-[1.3rem] overflow-hidden bg-gradient-to-br from-brandp-50 to-earth-1 dark:from-zinc-800 dark:to-zinc-900">
      <NuxtLink
        v-if="recipe.recipe_id"
        :to="`/recipe-wrangler/${recipe.recipe_id}`"
        :target="linkTarget"
        class="block w-full h-full"
        :aria-label="t('foodChatHome.mealCard.viewRecipe')"
        tabindex="-1"
      >
        <img
          v-if="recipeImage"
          :src="recipeImage"
          alt=""
          class="w-full h-full object-cover transition-transform duration-300 pointer-fine:hover:scale-[1.03] motion-reduce:transition-none"
          loading="lazy"
        >
        <span
          v-else
          class="w-full h-full flex items-center justify-center"
        >
          <UIcon
            :name="icon"
            class="w-10 h-10 text-brandp-300 dark:text-brandp-700"
          />
        </span>
      </NuxtLink>
      <span
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 dark:bg-zinc-900/85 px-2.5 py-1 text-xs font-semibold text-gray-900 dark:text-white shadow-sm"
      >
        <UIcon
          :name="icon"
          class="w-3.5 h-3.5 text-brandp-500 dark:text-brandp-300"
        />
        {{ type }}<template v-if="time"> · {{ time }}</template>
        <template v-if="courseLabel"> · {{ courseLabel }}</template>
      </span>
      <button
        v-if="recipe.recipe_id"
        type="button"
        class="absolute right-2.5 top-2.5 flex items-center justify-center size-9 pointer-coarse:size-11 rounded-full bg-white/92 dark:bg-zinc-900/85 shadow-sm pointer-fine:hover:scale-110 transition-transform"
        :aria-label="isFavorite ? t('recipeWrangler.recipe.removeFromFavorites') : t('recipeWrangler.recipe.addToFavorites')"
        :aria-pressed="isFavorite"
        @click.prevent.stop="toggleFavorite"
      >
        <FavoriteHeart
          :active="isFavorite"
          :class="['w-4.5 h-4.5', isFavorite ? 'text-red-500' : 'text-gray-500 dark:text-zinc-400']"
        />
      </button>
    </div>

    <div class="flex flex-col gap-2.5 p-4 flex-1">
      <!-- FoodChat is finding another dish for this meal -->
      <div
        v-if="busy"
        class="flex flex-col gap-2.5 py-1"
        role="status"
      >
        <span class="text-[0.8125rem] font-semibold text-gray-500 dark:text-zinc-400">
          {{ t('foodChatHome.mealCard.swapping', { meal: type.toLowerCase() }) }}
        </span>
        <span class="fc-shimmer h-3.5 w-11/12 rounded-full" />
        <span class="fc-shimmer h-3.5 w-3/5 rounded-full" />
      </div>

      <template v-else>
        <!-- The dish -->
        <div class="min-w-0">
          <span
            v-if="isMultiPlate"
            class="inline-flex items-center px-1.5 py-0.5 mb-1 text-[0.625rem] font-semibold uppercase tracking-wide rounded"
            :class="roleBadgeClass(recipe)"
          >{{ roleLabel(recipe) }}</span>
          <NuxtLink
            v-if="recipe.recipe_id"
            :to="`/recipe-wrangler/${recipe.recipe_id}`"
            :target="linkTarget"
            class="block text-[1.0625rem] font-bold leading-snug text-gray-900 dark:text-white line-clamp-2 hover:text-brandp-600 dark:hover:text-brandp-300 transition-colors"
            :title="recipe.title"
          >{{ recipe.title }}</NuxtLink>
          <h3
            v-else
            class="text-[1.0625rem] font-bold leading-snug text-gray-900 dark:text-white line-clamp-2"
          >
            {{ recipe.title }}
          </h3>
        </div>

        <!-- The rest of the meal, a line each -->
        <ul
          v-if="extraPlates?.length"
          class="flex flex-col gap-1.5"
        >
          <li
            v-for="(plate, pIdx) in extraPlates"
            :key="plate.recipe_id || `plate-${pIdx}`"
            class="flex items-center gap-2 min-w-0"
          >
            <span
              class="inline-flex items-center px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide rounded shrink-0"
              :class="roleBadgeClass(plate)"
            >{{ roleLabel(plate) }}</span>
            <NuxtLink
              v-if="plate.recipe_id"
              :to="`/recipe-wrangler/${plate.recipe_id}`"
              :target="linkTarget"
              class="truncate text-sm font-semibold text-gray-800 dark:text-zinc-100 hover:text-brandp-600 dark:hover:text-brandp-300"
            >{{ plate.title }}</NuxtLink>
            <span
              v-else
              class="truncate text-sm font-semibold text-gray-800 dark:text-zinc-100"
            >{{ plate.title }}</span>
          </li>
        </ul>

        <!-- How much: one line; carbs and fat on hover -->
        <div
          v-if="metaLine"
          class="flex items-center gap-2 flex-wrap"
        >
          <UTooltip
            :text="detailLine"
            :disabled="!detailLine"
          >
            <span
              class="text-[0.8125rem] font-semibold text-gray-600 dark:text-zinc-300 tabular-nums"
              :class="detailLine ? 'border-b border-dotted border-gray-300 dark:border-zinc-600 cursor-help' : ''"
              :tabindex="detailLine ? 0 : undefined"
            >{{ metaLine }}</span>
          </UTooltip>
          <span
            v-if="nutriScoreGrade"
            class="inline-flex items-center justify-center size-5.5 rounded-md text-[0.6875rem] font-bold leading-none"
            :class="nutriScoreClass"
            :title="t('foodChatHome.mealCard.nutriScore', { label: nutriScoreGrade })"
            :aria-label="t('foodChatHome.mealCard.nutriScore', { label: nutriScoreGrade })"
          >{{ nutriScoreGrade }}</span>
          <span
            v-if="isMultiPlate && mealMacros && !mealMacros.complete"
            class="text-[0.6875rem] text-amber-600 dark:text-amber-400"
          >{{ t('foodChatHome.mealCard.partialMeal') }}</span>
        </div>

        <!-- What just changed, or the one reason this dish is here -->
        <span
          v-if="tag"
          class="self-start inline-flex items-center gap-1.5 rounded-full bg-brandg-50 dark:bg-brandg-900/30 px-2.5 py-1 text-xs font-semibold text-brandg-800 dark:text-brandg-200"
        >
          <UIcon
            name="i-lucide-sparkles"
            class="w-3.5 h-3.5"
          />
          {{ tag }}
        </span>
        <FoodchatInfoPopover
          v-else-if="firstReason"
          :text="reasonTooltip(firstReason.kind)"
        >
          <button
            type="button"
            class="self-start inline-flex items-center gap-1.5 rounded-full bg-brandp-50/80 dark:bg-brandp-950/40 px-2.5 py-1 pointer-coarse:min-h-8 text-xs font-semibold text-brandp-600 dark:text-brandp-300"
          >
            <UIcon
              :name="reasonIcon(firstReason.kind)"
              class="w-3.5 h-3.5 shrink-0"
            />
            <span class="max-w-44 truncate">{{ firstReason.label }}</span>
          </button>
        </FoodchatInfoPopover>
      </template>

      <!-- Swap: say what you want instead. Bottom of the card, always in the
           same place, so a week of cards reads as one row of the same button. -->
      <div class="mt-auto flex items-center gap-1 pt-1">
        <UPopover
          v-model:open="swapOpen"
          :content="{ align: 'start', side: 'bottom', sideOffset: 6 }"
          :ui="{ content: 'w-[19rem] rounded-2xl p-3.5' }"
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 h-10 pointer-coarse:h-11 rounded-full pl-3 pr-4 bg-brandp-50 hover:bg-brandp-100 dark:bg-brandp-950/50 dark:hover:bg-brandp-900/60 text-brandp-600 dark:text-brandp-200 text-sm font-bold transition-colors disabled:opacity-50"
            :disabled="busy"
            :aria-label="t('foodChatHome.mealCard.swapMeal', { meal: type })"
            data-flows="foodchat-meal-replace"
          >
            <UIcon
              name="i-lucide-repeat"
              class="w-4.5 h-4.5"
            />
            {{ t('foodChatHome.mealCard.swap') }}
          </button>
          <template #content>
            <div class="flex flex-col gap-2.5">
              <p class="text-[0.9375rem] font-bold text-gray-900 dark:text-white">
                {{ t('foodChatHome.mealCard.swapFor', { meal: type.toLowerCase() }) }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="option in SWAP_OPTIONS"
                  :key="option.key"
                  type="button"
                  class="inline-flex items-center gap-1.5 h-9 rounded-full border border-gray-200 dark:border-zinc-700 px-3 text-[0.8125rem] font-semibold text-gray-900 dark:text-white hover:border-brandp-400 hover:bg-brandp-50/60 dark:hover:bg-brandp-950/40 transition-colors"
                  @click="chooseSwap(option)"
                >
                  <span aria-hidden="true">{{ option.emoji }}</span>
                  {{ t(`foodChatHome.mealCard.swapOptions.${option.key}`) }}
                </button>
              </div>
              <button
                type="button"
                class="flex items-center gap-2 h-10 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 px-3 text-left text-[0.8125rem] text-gray-500 dark:text-zinc-400 hover:border-brandp-300"
                @click="swapOpen = false; emit('replace')"
              >
                <UIcon
                  name="i-lucide-message-square-text"
                  class="w-4 h-4 shrink-0"
                />
                {{ t('foodChatHome.mealCard.swapOwn') }}
              </button>
              <p class="text-xs text-gray-500 dark:text-zinc-400">
                {{ t('foodChatHome.mealCard.swapOnly', { meal: type.toLowerCase() }) }}
              </p>
            </div>
          </template>
        </UPopover>
        <span class="flex-1" />
        <UDropdownMenu
          v-if="menuItems.length"
          :items="menuItems"
          :content="{ align: 'end' }"
          :ui="{ content: 'min-w-44' }"
        >
          <button
            type="button"
            class="flex items-center justify-center size-10 pointer-coarse:size-11 rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            :aria-label="t('foodChatHome.mealCard.menu')"
            data-flows="foodchat-meal-menu"
          >
            <UIcon
              name="i-lucide-ellipsis"
              class="w-5 h-5"
            />
          </button>
        </UDropdownMenu>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { MealRecipe } from '~/services/foodchatApi'
import type { Recipe } from '~/services/recipeApi'
import recipeApi from '~/services/recipeApi'
import { useRecipeStore } from '~/stores/recipe'
import { humaniseSlot, plateRoleBadgeClass } from '~/utils/planMeals'

const props = defineProps<{
  type: string
  /** Suggested clock time. Empty for slots with no sensible default. */
  time: string
  icon: string
  /** "Main Dish" / "Salad" — set only when a meal has several plates. */
  courseLabel?: string
  recipe: MealRecipe
  /**
   * The rest of this meal's plates — the salad beside the main, the dessert
   * after it. One card per MEAL: the main leads, the rest sit under it, and
   * the numbers are the meal's.
   */
  extraPlates?: MealRecipe[]
  /** FoodChat is replacing this meal right now. */
  busy?: boolean
  /** What just changed here ("New · lighter"); replaces the reason tag. */
  tag?: string
}>()

const emit = defineEmits<{
  /** "Or say what you'd like": the chat takes it from here. */
  replace: []
  /** One of the swap choices, as the directive FoodChat's swap tool reads. */
  swap: [directive: string, label: string]
  adapt: []
}>()

const { t } = useI18n()
const { isCoarsePointer } = useViewport()

/**
 * Swap choices, and what each asks FoodChat for. The directives are English
 * on purpose: FoodChat's swap tool reads and verifies them ("lighter" is checked
 * against real calories), whatever language the reader uses.
 */
const SWAP_OPTIONS = [
  { key: 'lighter', emoji: '🪶', directive: 'lighter' },
  { key: 'quicker', emoji: '⏱️', directive: 'quicker' },
  { key: 'vegetarian', emoji: '🥦', directive: 'vegetarian' },
  { key: 'protein', emoji: '💪', directive: 'more protein' },
  { key: 'surprise', emoji: '🎲', directive: 'something different' }
] as const

const swapOpen = ref(false)

function chooseSwap(option: typeof SWAP_OPTIONS[number]) {
  swapOpen.value = false
  // "New · surprise me" says nothing; that one is just "New".
  emit('swap', option.directive, option.key === 'surprise' ? '' : t(`foodChatHome.mealCard.swapOptions.${option.key}`))
}

/**
 * Recipe links open beside the plan under a mouse and in place on a finger:
 * a phone has no "beside", and a second tab is where a plan goes to be lost.
 */
const linkTarget = computed(() => isCoarsePointer.value ? undefined : '_blank')

// ── The ⋯ menu: the recipe, and adapting it ──
const menuItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = []
  if (props.recipe.recipe_id) {
    items.push({
      label: t('foodChatHome.mealCard.viewRecipe'),
      icon: 'i-lucide-book-open',
      to: `/recipe-wrangler/${props.recipe.recipe_id}`,
      target: linkTarget.value
    })
    items.push({
      'label': t('foodChatHome.mealCard.adapt'),
      'icon': 'i-lucide-wand-sparkles',
      'data-flows': 'foodchat-meal-adapt',
      'onSelect': () => emit('adapt')
    })
  }
  return items
})

const recipeStore = useRecipeStore()

const isFavorite = computed(() => props.recipe.recipe_id ? recipeStore.isFavorite(props.recipe.recipe_id) : false)

const toggleFavorite = () => {
  if (!props.recipe.recipe_id) return
  recipeStore.toggleFavorite(props.recipe.recipe_id)
}

const nutritionData = ref<Recipe | null>(null)
// Prefer the image the plan already carries; fall back to the fetched recipe
const recipeImage = ref<string | null>(props.recipe.image_url ?? null)

/**
 * Fetch the full recipe only when the plan did not already carry what we need:
 * old stored plans without macros, or a plan without the photo.
 *
 * Keyed on the recipe, not the mount: cards are keyed by meal slot, so a Swap
 * hands this same card a new dish, and it must not keep the old one's photo.
 */
let loadSeq = 0
async function loadRecipeExtras() {
  const seq = ++loadSeq
  nutritionData.value = null
  recipeImage.value = props.recipe.image_url ?? null
  if (!props.recipe.recipe_id) return
  const nutrition = props.recipe.nutrition
  const hasMacros = Boolean(nutrition && typeof nutrition.protein_g === 'number')
  if (hasMacros && recipeImage.value) return
  try {
    const r = await recipeApi.getRecipe(props.recipe.recipe_id)
    if (seq !== loadSeq) return
    if (!hasMacros) nutritionData.value = r
    if (!recipeImage.value) recipeImage.value = r.image_url ?? null
  } catch {
    // non-critical
  }
}

onMounted(loadRecipeExtras)
watch(() => props.recipe.recipe_id, (now, before) => {
  if (now !== before) void loadRecipeExtras()
})

/** Every plate of this meal, main first. */
const plates = computed<MealRecipe[]>(() => [props.recipe, ...(props.extraPlates ?? [])])

const isMultiPlate = computed(() => plates.value.length > 1)

/** A plate's role, humanised — "Main", "Salad", "Dessert". */
function roleLabel(plate: MealRecipe): string {
  const key = `foodChatHome.mealCard.roles.${String(plate.role || 'main').toLowerCase()}`
  const translated = t(key)
  return translated === key ? humaniseSlot(String(plate.role || 'main')) : translated
}

function roleBadgeClass(plate: MealRecipe): string {
  return plateRoleBadgeClass(plate.role)
}

/**
 * The MEAL's macros — every plate added up. `complete` is false when a plate
 * carries no profile, and the card says so rather than presenting a partial
 * sum as the whole.
 */
const mealMacros = computed(() => {
  let kcal = 0, protein = 0, carbs = 0, fat = 0
  let counted = 0
  for (const plate of plates.value) {
    const n = plate.nutrition
    if (!n || typeof n.kcal !== 'number') continue
    counted += 1
    kcal += n.kcal ?? 0
    protein += n.protein_g ?? 0
    carbs += n.carbs_g ?? 0
    fat += n.fat_g ?? 0
  }
  if (!counted) return null
  return { kcal, protein, carbs, fat, complete: counted === plates.value.length }
})

/** "459 kcal · 24 g protein": the meal's, or the dish's, or what the recipe says. */
const metaLine = computed(() => {
  const m = mealMacros.value
  if (m) {
    return t('foodChatHome.mealCard.nutritionSummary', {
      kcal: Math.round(m.kcal),
      protein: Math.round(m.protein)
    })
  }
  const d = nutritionData.value
  if (d && typeof d.total_kcal_per_serving === 'number') {
    return t('foodChatHome.mealCard.nutritionSummary', {
      kcal: Math.round(d.total_kcal_per_serving),
      protein: Math.round(d.total_protein_g_per_serving ?? 0)
    })
  }
  return ''
})

/** Carbs and fat, for the tooltip on the line above. */
const detailLine = computed(() => {
  const m = mealMacros.value
  if (m) return t('foodChatHome.mealCard.macroSummary', { carbs: Math.round(m.carbs), fat: Math.round(m.fat) })
  const d = nutritionData.value
  if (d && typeof d.total_carbs_g_per_serving === 'number') {
    return t('foodChatHome.mealCard.macroSummary', {
      carbs: Math.round(d.total_carbs_g_per_serving),
      fat: Math.round(d.total_fat_g_per_serving ?? 0)
    })
  }
  return ''
})

const nutriScoreGrade = computed(() => {
  const label = props.recipe.nutrition?.nutri_score_label?.trim().toUpperCase()
  if (!label) return null
  if (/^[A-E]$/.test(label)) return label
  const last = label.slice(-1)
  return /^[A-E]$/.test(last) ? last : null
})

const NUTRI_SCORE_CLASSES: Record<string, string> = {
  A: 'bg-[#038141] text-white',
  B: 'bg-[#85BB2F] text-white',
  C: 'bg-[#FECB02] text-gray-900',
  D: 'bg-[#EE8100] text-white',
  E: 'bg-[#E63E11] text-white'
}

const nutriScoreClass = computed(() =>
  nutriScoreGrade.value ? NUTRI_SCORE_CLASSES[nutriScoreGrade.value] ?? 'bg-gray-400 text-white' : ''
)

const REASON_ICONS: Record<string, string> = {
  pinned: 'i-lucide-pin',
  favorite: 'i-lucide-heart',
  memory: 'i-lucide-brain',
  profile: 'i-lucide-user',
  feedback: 'i-lucide-thumbs-up',
  diner: 'i-lucide-users',
  guideline: 'i-lucide-book-open'
}

/** The one reason shown on the card; the rest are in "Why this plan". */
const firstReason = computed(() => props.recipe.match_reasons?.[0] ?? null)

function reasonIcon(kind: string): string {
  return REASON_ICONS[kind] ?? 'i-lucide-sparkles'
}

function reasonTooltip(kind: string): string {
  return kind in REASON_ICONS
    ? t(`foodChatHome.mealCard.reasons.${kind}`)
    : kind
}
</script>

<style scoped>
.fc-shimmer {
  display: block;
  background: linear-gradient(90deg, rgb(241 239 243) 25%, rgb(230 226 234) 50%, rgb(241 239 243) 75%);
  background-size: 200% 100%;
  animation: fc-shimmer 1.1s linear infinite;
}
:global(.dark) .fc-shimmer {
  background: linear-gradient(90deg, rgb(39 39 42) 25%, rgb(52 52 56) 50%, rgb(39 39 42) 75%);
  background-size: 200% 100%;
}
@keyframes fc-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .fc-shimmer { animation: none; }
}
</style>
