<template>
  <div
    class="relative flex flex-col gap-3 p-5 transition-all"
    :class="isMultiPlate
      ? 'bg-brandp-50/40 dark:bg-brandp-950/20 ring-1 ring-inset ring-brandp-200/70 dark:ring-brandp-900/50 hover:bg-brandp-50/70 dark:hover:bg-brandp-950/30'
      : 'bg-white dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-700/30'"
  >
    <!-- Meal type + time -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <UIcon
          :name="icon"
          class="w-5 h-5 text-brandp-500"
        />
        <span class="text-xs font-semibold uppercase tracking-wider text-brandp-600 dark:text-brandp-400">{{ type }}</span>
        <!-- Which plate of the meal this is. Shown only for multi-course meals,
             where two cards otherwise share a heading and look like a bug. -->
        <span
          v-if="courseLabel"
          class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brandp-50 dark:bg-brandp-900/30 text-brandp-600 dark:text-brandp-400"
        >{{ courseLabel }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          v-if="recipe.recipe_id"
          type="button"
          class="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 hover:scale-110 transition-all duration-200"
          :aria-label="isFavorite ? t('recipeWrangler.recipe.removeFromFavorites') : t('recipeWrangler.recipe.addToFavorites')"
          @click.prevent.stop="toggleFavorite"
        >
          <UIcon
            name="i-lucide-heart"
            :class="[
              'w-4 h-4 transition-colors duration-200',
              isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-zinc-500'
            ]"
          />
        </button>
        <span
          v-if="time"
          class="text-xs text-gray-400 font-light"
        >{{ time }}</span>
        <!-- Slot menu: replace via chat, adapt in RecipeWrangler -->
        <div
          class="relative"
          @mouseleave="menuOpen = false"
        >
          <button
            type="button"
            class="flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            :aria-label="t('foodChatHome.mealCard.menu')"
            :aria-expanded="menuOpen"
            @click.prevent.stop="menuOpen = !menuOpen"
          >
            <UIcon
              name="i-lucide-more-vertical"
              class="w-4 h-4 text-gray-400 dark:text-zinc-500"
            />
          </button>
          <Transition name="chips-fade">
            <div
              v-if="menuOpen"
              class="absolute right-0 top-7 z-20 w-40 rounded-xl border border-gray-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden"
            >
              <button
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
                @click.prevent.stop="onMenuAction('replace')"
              >
                <UIcon
                  name="i-lucide-replace"
                  class="w-3.5 h-3.5 text-brandp-400"
                />
                {{ t('foodChatHome.mealCard.replace') }}
              </button>
              <button
                v-if="recipe.recipe_id"
                type="button"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-brandp-50 dark:hover:bg-brandp-950/30 transition-colors"
                @click.prevent.stop="onMenuAction('adapt')"
              >
                <UIcon
                  name="i-lucide-wand-sparkles"
                  class="w-3.5 h-3.5 text-brandp-400"
                />
                {{ t('foodChatHome.mealCard.adapt') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Recipe info row -->
    <div class="flex items-center gap-3 pr-16">
      <!-- Circular image bubble -->
      <NuxtLink
        :to="recipe.recipe_id ? `/recipe-wrangler/${recipe.recipe_id}` : ''"
        :target="recipe.recipe_id ? '_blank' : undefined"
        class="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-700 transition-transform duration-200 hover:scale-150 block"
      >
        <img
          v-if="recipeImage"
          :src="recipeImage"
          class="w-full h-full object-cover"
          loading="lazy"
        >
        <div
          v-else-if="nutritionLoading"
          class="w-full h-full animate-pulse bg-gray-200 dark:bg-zinc-600"
        />
        <div
          v-else
          class="w-full h-full flex items-center justify-center"
        >
          <UIcon
            name="i-lucide-utensils"
            class="w-4 h-4 text-gray-300 dark:text-zinc-600"
          />
        </div>
      </NuxtLink>

      <div class="flex-1 min-w-0">
        <!-- The plate's role, as a badge on the dish rather than in the meal
             heading: on a two-plate lunch the heading says "LUNCH" once, and
             what distinguishes the dishes is which plate each one is. -->
        <span
          v-if="isMultiPlate"
          class="inline-flex items-center px-1.5 py-0.5 mb-1 text-[10px] font-semibold uppercase tracking-wide rounded"
          :class="roleBadgeClass(recipe)"
        >{{ roleLabel(recipe) }}</span>
        <NuxtLink
          v-if="recipe.recipe_id"
          :to="`/recipe-wrangler/${recipe.recipe_id}`"
          target="_blank"
          class="block font-medium text-base sm:text-lg text-gray-900 dark:text-white leading-snug hover:text-brandp-500 dark:hover:text-brandp-300 transition-colors"
        >{{ recipe.title }}</NuxtLink>
        <h3
          v-else
          class="font-medium text-base sm:text-lg text-gray-900 dark:text-white leading-snug"
        >
          {{ recipe.title }}
        </h3>
      </div>
    </div>

    <!-- The rest of the meal. Compact rows under the main, divided from it:
         a salad beside a main is part of that lunch, not another lunch. -->
    <div
      v-if="extraPlates?.length"
      class="border-t border-gray-100 dark:border-zinc-700/60 pt-3 space-y-2.5"
    >
      <div
        v-for="(plate, pIdx) in extraPlates"
        :key="plate.recipe_id || `plate-${pIdx}`"
        class="flex items-center gap-3 pr-16"
      >
        <NuxtLink
          :to="plate.recipe_id ? `/recipe-wrangler/${plate.recipe_id}` : ''"
          :target="plate.recipe_id ? '_blank' : undefined"
          class="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-700 transition-transform duration-200 hover:scale-150 block"
        >
          <img
            v-if="plate.image_url"
            :src="plate.image_url"
            class="w-full h-full object-cover"
            loading="lazy"
          >
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-salad"
              class="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600"
            />
          </div>
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <span
            class="inline-flex items-center px-1.5 py-0.5 mb-0.5 text-[10px] font-semibold uppercase tracking-wide rounded"
            :class="roleBadgeClass(plate)"
          >{{ roleLabel(plate) }}</span>
          <NuxtLink
            v-if="plate.recipe_id"
            :to="`/recipe-wrangler/${plate.recipe_id}`"
            target="_blank"
            class="block text-sm font-medium text-gray-800 dark:text-zinc-100 leading-snug hover:text-brandp-500 dark:hover:text-brandp-300 transition-colors"
          >{{ plate.title }}</NuxtLink>
          <span
            v-else
            class="block text-sm font-medium text-gray-800 dark:text-zinc-100 leading-snug"
          >{{ plate.title }}</span>
        </div>
      </div>
    </div>

    <!-- One line for the whole MEAL when it has more than one plate.
         Two calorie figures side by side ask the member to add up their own
         lunch; the main's figure alone understates it. -->
    <div
      v-if="isMultiPlate && mealMacros"
      class="flex items-center gap-2 flex-wrap pr-16 border-t border-gray-100 dark:border-zinc-700/60 pt-3"
    >
      <UIcon name="i-lucide-flame" class="w-3.5 h-3.5 text-brandp-400 shrink-0" />
      <span class="text-[11px] text-gray-600 dark:text-zinc-300 tabular-nums font-light">
        {{ mealMacroLine }}
      </span>
      <span
        v-if="!mealMacros.complete"
        class="text-[10px] text-amber-600 dark:text-amber-400"
      >{{ t('foodChatHome.mealCard.partialMeal') }}</span>
    </div>

    <!-- Nutrition summary + Nutri-Score (M4 transparency) -->
    <div
      v-if="!isMultiPlate && recipe.nutrition"
      class="flex items-center gap-1.5 flex-wrap pr-16 -mt-1"
    >
      <span class="inline-flex items-center px-2 py-1 text-[11px] rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-300 font-light">
        {{ nutritionSummary }}
      </span>
      <span
        v-if="macroSummary"
        class="inline-flex items-center px-2 py-1 text-[11px] rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-300 font-light"
      >{{ macroSummary }}</span>
      <span
        v-if="nutriScoreGrade"
        class="inline-flex items-center justify-center w-[18px] h-[18px] rounded text-[10px] font-bold leading-none"
        :class="nutriScoreClass"
        :title="t('foodChatHome.mealCard.nutriScore', { label: nutriScoreGrade })"
      >{{ nutriScoreGrade }}</span>
    </div>

    <!-- Match-reason chips (M4 transparency) -->
    <div
      v-if="recipe.match_reasons?.length"
      class="flex flex-wrap gap-1 pr-14"
    >
      <UTooltip
        v-for="(reason, rIdx) in recipe.match_reasons"
        :key="rIdx"
        :text="reasonTooltip(reason.kind)"
      >
        <span class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded-full border border-gray-200/80 dark:border-zinc-700/70 text-gray-400 dark:text-zinc-500 font-light">
          <UIcon
            :name="reasonIcon(reason.kind)"
            class="w-2.5 h-2.5 shrink-0"
          />
          <span class="max-w-24 truncate">{{ reason.label }}</span>
        </span>
      </UTooltip>
    </div>

    <!-- Nutrient donut — bottom right corner -->
    <div
      class="absolute bottom-4 right-4 cursor-help"
      @mouseleave="hoveredSegment = null"
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style="transform: rotate(-90deg)"
      >
        <!-- Track -->
        <circle
          cx="30"
          cy="30"
          r="23"
          stroke="#e5e7eb"
          stroke-width="6"
          fill="none"
          class="dark:stroke-zinc-700"
        />
        <!-- Segments -->
        <circle
          v-for="seg in segments"
          :key="seg.key"
          cx="30"
          cy="30"
          r="23"
          :stroke="seg.color"
          stroke-width="6"
          fill="none"
          :stroke-dasharray="`${seg.dash} ${circumference}`"
          :stroke-dashoffset="-seg.offset"
          stroke-linecap="butt"
          :style="{ opacity: hoveredSegment && hoveredSegment !== seg.key ? 0.25 : 1, transition: 'opacity 0.15s' }"
          @mouseenter="hoveredSegment = seg.key"
        />
      </svg>
      <!-- Center label -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          v-if="nutritionLoading"
          class="text-[9px] text-gray-400"
        >···</span>
        <template v-else-if="nutritionData">
          <span class="text-[10px] font-bold text-gray-700 dark:text-gray-200 leading-none">{{ centerValue }}</span>
          <span class="text-[8px] text-gray-400 dark:text-zinc-500 leading-none mt-0.5">{{ centerLabel }}</span>
        </template>
        <span
          v-else
          class="text-[9px] text-gray-300"
        >—</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MealRecipe } from '~/services/foodchatApi'
import type { Recipe } from '~/services/recipeApi'
import recipeApi from '~/services/recipeApi'
import { useRecipeStore } from '~/stores/recipe'
import { humaniseSlot } from '~/utils/planMeals'

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
   * after it.
   *
   * A multi-plate meal used to be rendered as several SIBLING cards sharing a
   * heading, which reads as three meals rather than one, and which totalled
   * each plate separately so a two-plate lunch showed two calorie figures and
   * no meal figure. One card per MEAL is what a plate actually is: the main
   * leads, the rest sit under it, and the numbers are the meal's.
   *
   * Absent or empty keeps the single-plate card byte for byte.
   */
  extraPlates?: MealRecipe[]
}>()

const emit = defineEmits<{
  replace: []
  adapt: []
}>()

const { t } = useI18n()

// ── Slot menu (replace / adapt) ──
const menuOpen = ref(false)

function onMenuAction(action: 'replace' | 'adapt') {
  menuOpen.value = false
  emit(action)
}

const recipeStore = useRecipeStore()

const isFavorite = computed(() => props.recipe.recipe_id ? recipeStore.isFavorite(props.recipe.recipe_id) : false)

const toggleFavorite = () => {
  if (!props.recipe.recipe_id) return
  recipeStore.toggleFavorite(props.recipe.recipe_id)
}

const nutritionData = ref<Recipe | null>(null)
const nutritionLoading = ref(false)
// Prefer the image the plan already carries; fall back to the fetched recipe
const recipeImage = ref<string | null>(props.recipe.image_url ?? null)
const hoveredSegment = ref<string | null>(null)

/**
 * Fetch the full recipe only when the plan did not already carry what we need.
 *
 * Every card used to do this unconditionally, to fill a macro donut from
 * `total_*_g_per_serving` — data the plan response now carries per meal. On a
 * weekly plan that was 21 extra requests for numbers already in hand.
 *
 * Still fetched when the plan predates carried macros, or when it has no image,
 * so old stored plans render exactly as before.
 */
onMounted(async () => {
  if (!props.recipe.recipe_id) return

  const nutrition = props.recipe.nutrition
  const hasMacros = Boolean(nutrition && typeof nutrition.protein_g === 'number')
  if (hasMacros && recipeImage.value) return

  nutritionLoading.value = true
  try {
    const r = await recipeApi.getRecipe(props.recipe.recipe_id)
    if (!hasMacros) nutritionData.value = r
    if (!recipeImage.value) recipeImage.value = r.image_url ?? null
  } catch {
    // non-critical
  } finally {
    nutritionLoading.value = false
  }
})

// ── M4 transparency: nutrition chips, Nutri-Score badge, reason chips ──
const nutritionSummary = computed(() => {
  const n = props.recipe.nutrition
  if (!n) return ''
  return t('foodChatHome.mealCard.nutritionSummary', {
    kcal: Math.round(n.kcal),
    protein: Math.round(n.protein_g)
  })
})

/**
 * Carbs and fat, which the plan has always carried and nothing ever read.
 *
 * Kept as a second chip rather than folded into `nutritionSummary` so the
 * existing kcal/protein line keeps its wording and its translation.
 */
const macroSummary = computed(() => {
  const n = props.recipe.nutrition
  if (!n || typeof n.carbs_g !== 'number') return ''
  return t('foodChatHome.mealCard.macroSummary', {
    carbs: Math.round(n.carbs_g),
    fat: Math.round(n.fat_g ?? 0)
  })
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

function reasonIcon(kind: string): string {
  return REASON_ICONS[kind] ?? 'i-lucide-sparkles'
}

function reasonTooltip(kind: string): string {
  return kind in REASON_ICONS
    ? t(`foodChatHome.mealCard.reasons.${kind}`)
    : kind
}

// Brand palette colours (matching main.css vars)
// brandp-300 #a25ece  protein
// terracotta  #D98A6B  fat
// brandg-400  #b8c455  fiber
// earth-2     #CAD5B2  carbs
const SEGMENT_DEFS = [
  { key: 'protein', label: 'prot', color: '#a25ece' },
  { key: 'carbs', label: 'carbs', color: '#CAD5B2' },
  { key: 'fat', label: 'fat', color: '#D98A6B' },
  { key: 'fiber', label: 'fiber', color: '#b8c455' }
]

const circumference = 2 * Math.PI * 23

/** Every plate of this meal, main first. */
const plates = computed<MealRecipe[]>(() => [props.recipe, ...(props.extraPlates ?? [])])

const isMultiPlate = computed(() => plates.value.length > 1)

/** A plate's role, humanised — "Main", "Salad", "Dessert". */
function roleLabel(plate: MealRecipe): string {
  const key = `foodChatHome.mealCard.roles.${String(plate.role || 'main').toLowerCase()}`
  const translated = t(key)
  return translated === key ? humaniseSlot(String(plate.role || 'main')) : translated
}

const ROLE_BADGE: Record<string, string> = {
  main: 'bg-brandp-500 text-white',
  side: 'bg-emerald-500 text-white',
  salad: 'bg-emerald-500 text-white',
  soup: 'bg-amber-500 text-white',
  dessert: 'bg-pink-500 text-white',
  drink: 'bg-sky-500 text-white'
}

function roleBadgeClass(plate: MealRecipe): string {
  return ROLE_BADGE[String(plate.role || 'main').toLowerCase()]
    ?? 'bg-gray-400 text-white'
}

/**
 * The MEAL's macros — every plate added up, with what it could not see.
 *
 * A main plus a salad is one meal and one calorie figure. Reporting the main
 * alone understates what the member eats; reporting two figures side by side
 * asks them to add. `complete` is false when a plate carries no profile, and
 * the card says so rather than presenting a partial sum as the whole.
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

const mealMacroLine = computed(() => {
  const m = mealMacros.value
  if (!m) return ''
  return t('foodChatHome.mealCard.mealMacros', {
    kcal: Math.round(m.kcal),
    protein: Math.round(m.protein),
    carbs: Math.round(m.carbs),
    fat: Math.round(m.fat)
  })
})

const macros = computed(() => {
  // On a multi-plate meal the donut is the MEAL's balance, not the main's —
  // a main and a salad split differently from the main alone, which is the
  // whole reason the two plates are on one plate.
  if (isMultiPlate.value) {
    const m = mealMacros.value
    if (m) {
      return {
        protein: Math.max(m.protein, 0),
        carbs: Math.max(m.carbs, 0),
        fat: Math.max(m.fat, 0),
        fiber: 0
      }
    }
  }
  // The plan's own per-serving macros, when it carries them. Same numbers, same
  // source (the recipe's Postgres profile) — just already delivered.
  const n = props.recipe.nutrition
  if (n && typeof n.protein_g === 'number') {
    return {
      protein: Math.max(n.protein_g ?? 0, 0),
      carbs: Math.max(n.carbs_g ?? 0, 0),
      fat: Math.max(n.fat_g ?? 0, 0),
      fiber: Math.max(n.fiber_g ?? 0, 0)
    }
  }
  const d = nutritionData.value
  if (!d) return null
  return {
    protein: Math.max(d.total_protein_g_per_serving ?? 0, 0),
    carbs: Math.max(d.total_carbs_g_per_serving ?? 0, 0),
    fat: Math.max(d.total_fat_g_per_serving ?? 0, 0),
    fiber: Math.max(d.total_fiber_g_per_serving ?? 0, 0)
  }
})

const segments = computed(() => {
  const m = macros.value
  if (!m) return []
  const values: Record<string, number> = { protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber }
  const total = Object.values(values).reduce((s, v) => s + v, 0) || 1
  let offset = 0
  return SEGMENT_DEFS.map((d) => {
    const dash = (values[d.key] / total) * circumference
    const seg = { ...d, dash, offset }
    offset += dash
    return seg
  })
})

const centerValue = computed(() => {
  const m = macros.value
  if (!m) return '—'
  const key = hoveredSegment.value ?? 'protein'
  const val = (m as Record<string, number>)[key] ?? 0
  return `${Math.round(val)}g`
})

const centerLabel = computed(() => {
  const def = SEGMENT_DEFS.find(d => d.key === (hoveredSegment.value ?? 'protein'))
  return def?.label ?? 'prot'
})
</script>
