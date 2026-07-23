<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

    <div class="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
        <div class="w-8 h-8 rounded-lg bg-brandp-50 dark:bg-brandp-950/40 flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-wand-sparkles" class="w-4 h-4 text-brandp-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ t('foodChatHome.adaptModal.title') }}</p>
          <p class="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{{ recipe?.title || '…' }}</p>
        </div>
        <button
          class="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          :aria-label="t('foodChatHome.adaptModal.close')"
          @click="emit('close')"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>

      <div class="px-4 py-3 max-h-[60vh] overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading" class="py-8 text-center">
          <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-brandp-400 animate-spin mx-auto mb-2" />
          <p class="text-xs text-gray-400 dark:text-zinc-500">{{ t('foodChatHome.adaptModal.loading') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="py-6 text-center space-y-2">
          <UIcon name="i-lucide-alert-circle" class="w-6 h-6 text-amber-500 mx-auto" />
          <p class="text-xs text-gray-500 dark:text-zinc-400">{{ error }}</p>
        </div>

        <!-- Already optimal -->
        <div v-else-if="result?.status === 'already_optimal' || (result && !suggestions.length)" class="py-6 text-center space-y-2">
          <UIcon name="i-lucide-badge-check" class="w-7 h-7 text-emerald-500 mx-auto" />
          <p class="text-sm font-medium text-gray-700 dark:text-zinc-200">{{ t('foodChatHome.adaptModal.alreadyOptimal') }}</p>
          <p v-if="currentGrade" class="text-[11px] text-gray-400 dark:text-zinc-500">Nutri-Score {{ currentGrade }}</p>
        </div>

        <!-- Suggestions -->
        <div v-else class="space-y-2">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.rank"
            class="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 p-3 space-y-1.5"
          >
            <div class="flex items-start gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug">
                  {{ suggestion.explanation?.headline || suggestionFallbackLine(suggestion) }}
                </p>
                <p v-if="suggestion.explanation?.reason" class="mt-0.5 text-[11px] font-light text-gray-500 dark:text-zinc-400 leading-snug">
                  {{ suggestion.explanation.reason }}
                </p>
              </div>
              <span
                v-if="formatGrade(suggestion.simulated_nutri_score)"
                class="shrink-0 px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              >
                → {{ formatGrade(suggestion.simulated_nutri_score) }}
              </span>
            </div>
            <p
              v-if="suggestion.introduces_allergen && suggestion.new_allergens?.length"
              class="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 shrink-0" />
              {{ t('foodChatHome.adaptModal.allergenWarning', { list: suggestion.new_allergens.join(', ') }) }}
            </p>
            <div class="flex justify-end">
              <span v-if="savedRank === suggestion.rank" class="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <UIcon name="i-lucide-check" class="w-3 h-3" />
                {{ t('foodChatHome.adaptModal.saved') }}
              </span>
              <button
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors
                       bg-brandp-500 text-white hover:bg-brandp-600
                       disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
                :disabled="savingRank !== null || savedRank !== null"
                @click="save(suggestion)"
              >
                <UIcon v-if="savingRank === suggestion.rank" name="i-lucide-loader-2" class="w-3 h-3 animate-spin" />
                {{ t('foodChatHome.adaptModal.save') }}
              </button>
            </div>
          </div>
          <p v-if="saveError" class="text-[11px] text-red-500 dark:text-red-400">{{ saveError }}</p>
          <p v-if="savedRank !== null" class="text-[11px] font-light text-gray-400 dark:text-zinc-500 leading-snug">
            {{ t('foodChatHome.adaptModal.savedHint') }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800">
        <NuxtLink
          :to="`/recipe-wrangler/${recipeId}`"
          target="_blank"
          class="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:underline transition-colors"
        >
          {{ t('foodChatHome.adaptModal.openFull') }}
          <UIcon name="i-lucide-arrow-up-right" class="w-3 h-3" />
        </NuxtLink>
        <button
          class="text-[11px] text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          @click="emit('close')"
        >
          {{ t('foodChatHome.adaptModal.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import recipeApi, { type Recipe, type RecipeAdaptSuggestion, type RecipeAdaptSuggestionsResult, type RecipeIngredient } from '~/services/recipeApi'
import memberAdaptedRecipesApi, { type AdaptedRecipeNutrition } from '~/services/memberAdaptedRecipesApi'
import { useHouseholdStore } from '~/stores/household'

const props = defineProps<{ recipeId: string }>()
const emit = defineEmits<{ close: [], saved: [] }>()

const { t } = useI18n()
const householdStore = useHouseholdStore()

const loading = ref(true)
const error = ref<string | null>(null)
const recipe = ref<Recipe | null>(null)
const result = ref<RecipeAdaptSuggestionsResult | null>(null)
const savingRank = ref<number | null>(null)
const savedRank = ref<number | null>(null)
const saveError = ref<string | null>(null)

const region = computed(() => {
  const raw = String(householdStore.currentHousehold?.region || '').toUpperCase()
  return raw === 'HU' || raw === 'US' || raw === 'IE' ? raw : 'IE'
})

const suggestions = computed<RecipeAdaptSuggestion[]>(() => result.value?.suggestions ?? [])
const formatGrade = (raw?: string | null): string => String(raw || '').replace('Nutriscore_', '')
const currentGrade = computed(() => formatGrade(result.value?.current_nutri_score))

function suggestionFallbackLine(s: RecipeAdaptSuggestion): string {
  if (s.action === 'reduce') return t('foodChatHome.adaptModal.reduceLine', { ingredient: s.original_ingredient })
  return t('foodChatHome.adaptModal.swapLine', { from: s.original_ingredient, to: s.substitute_name || '' })
}

onMounted(async () => {
  try {
    const [r, res] = await Promise.all([
      recipeApi.getRecipe(props.recipeId),
      recipeApi.getAdaptSuggestions(props.recipeId, { region: region.value })
    ])
    recipe.value = r
    result.value = res
  } catch (err: unknown) {
    error.value = (err as { message?: string })?.message || t('foodChatHome.adaptModal.error')
  } finally {
    loading.value = false
  }
})

// Mirrors the RecipeWrangler detail page's save flow (buildAdaptedIngredients
// + simulate-backed nutrition) so both entry points produce identical
// adapted-version records.
function buildAdaptedIngredients(suggestion: RecipeAdaptSuggestion): RecipeIngredient[] {
  const target = String(suggestion.original_ingredient || '').trim().toLowerCase()
  return (recipe.value?.ingredients || []).map((ing) => {
    if (String(ing.name || '').trim().toLowerCase() !== target) {
      return { name: ing.name, measurement: ing.measurement }
    }
    if (suggestion.action === 'reduce' && suggestion.reduced_to_weight_g) {
      return { name: ing.name, measurement: `${Math.round(suggestion.reduced_to_weight_g)} g` }
    }
    if (suggestion.substitute_name) {
      return { name: suggestion.substitute_name, measurement: ing.measurement }
    }
    return { name: ing.name, measurement: ing.measurement }
  })
}

const toNullableNumber = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

async function save(suggestion: RecipeAdaptSuggestion) {
  const memberId = householdStore.currentMember?.id
  if (!memberId || !recipe.value || savingRank.value !== null) return
  saveError.value = null
  savingRank.value = suggestion.rank
  try {
    let nutrition: AdaptedRecipeNutrition = {
      nutri_score_label: formatGrade(suggestion.simulated_nutri_score) || null
    }
    if (suggestion.action !== 'reduce' && suggestion.substitute_name) {
      try {
        const simulation = await recipeApi.adaptSimulate(recipe.value.recipe_id, {
          region: region.value,
          originalIngredient: suggestion.original_ingredient,
          substituteIngredient: suggestion.substitute_name
        }) as Record<string, unknown>
        const totals = (simulation.simulated_total_nutrients_per_serving || {}) as Record<string, unknown>
        nutrition = {
          kcal: toNullableNumber(totals.energy_kcal),
          protein_g: toNullableNumber(totals.protein_g),
          carbs_g: toNullableNumber(totals.carbs_g),
          fat_g: toNullableNumber(totals.fat_g),
          nutri_score_label: formatGrade(String(simulation.simulated_nutri_score || '')) || nutrition.nutri_score_label
        }
      } catch { /* fall back to the suggestion's own grade */ }
    }

    await memberAdaptedRecipesApi.saveAdaptedRecipe(
      memberId,
      recipe.value.recipe_id,
      `${recipe.value.title} ${t('recipeWrangler.detail.adaptation.adaptedSuffix')}`,
      {
        mode: result.value?.mode || 'nutrition',
        action: suggestion.action,
        original_ingredient: suggestion.original_ingredient,
        substitute_ingredient: suggestion.substitute_name || null,
        reduction_pct: suggestion.reduction_pct ?? null,
        ingredients: buildAdaptedIngredients(suggestion),
        nutrition,
        region: region.value,
        suggestion: {
          headline: suggestion.explanation?.headline || '',
          reason: suggestion.explanation?.reason || ''
        },
        base: {
          title: recipe.value.title,
          image_url: recipe.value.image_url,
          nutri_score_label: null
        }
      }
    )
    savedRank.value = suggestion.rank
    emit('saved')
  } catch (err: unknown) {
    saveError.value = (err as { message?: string })?.message || t('foodChatHome.adaptModal.error')
  } finally {
    savingRank.value = null
  }
}
</script>
