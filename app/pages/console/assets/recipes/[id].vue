<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <section class="flex flex-col gap-6 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 space-y-3">
          <h1 class="min-w-0 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
            {{ pageTitle }}
          </h1>

          <div
            v-if="recipe"
            class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-fingerprint" class="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
              <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ recipe.recipe_id }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-database" class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span>{{ recipe.source || 'RecipeWrangler' }}</span>
            </div>
            <div
              v-if="recipe.region"
              class="flex items-center gap-1.5"
            >
              <UIcon name="i-lucide-map-pin" class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span>{{ recipe.region }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-clock" class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span>{{ recipe.duration ? `${recipe.duration} min` : '—' }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-users" class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <span>{{ recipe.serves ? `${recipe.serves} servings` : '—' }}</span>
            </div>
          </div>

          <div
            v-if="recipe && (displayTags.length || displayAllergens.length)"
            class="flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="tag in displayTags"
              :key="`tag-${tag}`"
              color="neutral"
              variant="subtle"
              size="sm"
            >
              {{ tag }}
            </UBadge>
            <UBadge
              v-for="allergen in displayAllergens"
              :key="`allergen-${allergen}`"
              color="warning"
              variant="soft"
              size="sm"
            >
              {{ allergen }}
            </UBadge>
          </div>

          <div
            v-if="recipe && nutriProfile.length"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <div
              v-for="item in nutriProfile"
              :key="item.label"
              class="flex items-baseline gap-1"
            >
              <span class="font-semibold tabular-nums text-gray-700 dark:text-gray-200">{{ item.value }}</span>
              <span class="text-gray-400 dark:text-gray-500">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="recipe"
            type="button"
            :color="expertRecipeInput ? 'primary' : 'neutral'"
            :variant="expertRecipeInput ? 'solid' : 'outline'"
            icon="i-lucide-star"
            size="sm"
            :loading="expertPatchPending"
            :disabled="expertPatchPending"
            @click="toggleExpertRecipe"
          >
            {{ expertRecipeInput ? 'Unmark Expert Recipe' : 'Mark as Expert Recipe' }}
          </UButton>
          <UBadge
            v-if="recipe"
            :color="editorStatus.color"
            variant="soft"
            size="sm"
          >
            {{ editorStatus.label }}
          </UBadge>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            :disabled="savePending || imageUploading || !hasUnsavedChanges"
            @click="resetWorkingCopy"
          >
            Reset
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            :to="publicRecipeRoute"
            target="_blank"
          >
            Public View
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :loading="savePending"
            :disabled="!hasUnsavedChanges || savePending || imageUploading"
            @click="saveRecipeEdits"
          >
            Save Changes
          </UButton>
        </div>
      </section>

      <UPageBody class="space-y-6">
        <UCard
          v-if="loading"
          :ui="{ body: 'p-6 sm:p-8' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <div class="animate-pulse space-y-4">
            <div class="h-6 w-48 rounded bg-gray-200 dark:bg-white/10" />
            <div class="h-28 rounded-2xl bg-gray-100 dark:bg-white/5" />
            <div class="h-48 rounded-2xl bg-gray-100 dark:bg-white/5" />
          </div>
        </UCard>

        <UCard
          v-else-if="loadError"
          :ui="{ body: 'p-6 sm:p-8' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <div class="space-y-4">
            <UAlert
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :title="loadError"
            />
            <div class="flex justify-end">
              <UButton
                color="primary"
                icon="i-lucide-refresh-cw"
                @click="loadRecipe"
              >
                Retry
              </UButton>
            </div>
          </div>
        </UCard>

        <template v-else-if="recipe">
          <div class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.95fr)]">
            <div class="space-y-6">
              <!-- Metadata -->
              <UCard
                :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                    Metadata
                  </h2>
                </template>

                <div class="space-y-4">
                  <UFormField label="Title">
                    <UInput
                      v-model="titleInput"
                      placeholder="Recipe title"
                      :disabled="savePending"
                      class="w-full"
                    />
                  </UFormField>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormField label="Duration (minutes)">
                      <UInput
                        v-model.number="durationInput"
                        type="number"
                        min="0"
                        placeholder="e.g. 30"
                        :disabled="savePending"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Source Collection">
                      <div ref="sourceBoxRef" class="relative">
                        <UInput
                          v-model="sourceInput"
                          placeholder="Search collections…"
                          :disabled="savePending"
                          :loading="collectionLoading"
                          class="w-full"
                          @input="handleCollectionInput"
                          @keydown.down.prevent="handleCollectionArrowDown"
                          @keydown.up.prevent="handleCollectionArrowUp"
                          @keydown.enter.prevent="handleCollectionEnter"
                          @keydown.esc="showCollectionDropdown = false"
                        />
                        <div
                          v-if="showCollectionDropdown"
                          class="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900"
                        >
                          <button
                            v-for="(col, idx) in collectionSuggestions"
                            :key="col.id"
                            type="button"
                            :class="[
                              'w-full px-3 py-2 text-left text-sm transition-colors',
                              activeCollectionIndex === idx
                                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                                : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/5'
                            ]"
                            @mousedown.prevent="selectCollection(col)"
                          >
                            {{ col.title }}
                          </button>
                        </div>
                        <p v-if="sourceIdValue" class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          ID: {{ sourceIdValue }}
                        </p>
                      </div>
                    </UFormField>
                  </div>

                  <UFormField label="Allergens">
                    <div class="space-y-2">
                      <div class="flex gap-2">
                        <UInput
                          v-model="allergenDraftInput"
                          placeholder="Type an allergen and press Enter"
                          :disabled="savePending"
                          class="flex-1"
                          @keydown.enter.prevent="addAllergenFromDraft"
                        />
                        <UButton
                          type="button"
                          color="neutral"
                          variant="outline"
                          icon="i-lucide-plus"
                          :disabled="savePending || !allergenDraftInput.trim()"
                          @click="addAllergenFromDraft"
                        />
                      </div>
                      <div
                        v-if="allergenTokens.length"
                        class="flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="(allergen, idx) in allergenTokens"
                          :key="`allergen-token-${idx}`"
                          class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          {{ allergen }}
                          <button
                            type="button"
                            class="ml-0.5 flex items-center justify-center rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/40"
                            :disabled="savePending"
                            @click="removeAllergen(idx)"
                          >
                            <UIcon name="i-lucide-x" class="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                      <p
                        v-else
                        class="text-xs text-gray-400 dark:text-gray-500"
                      >
                        No allergens added
                      </p>
                    </div>
                  </UFormField>

                  <UFormField label="Tags">
                    <div class="space-y-2">
                      <div class="flex gap-2">
                        <UInput
                          v-model="tagDraftInput"
                          placeholder="Type a tag and press Enter"
                          :disabled="savePending"
                          class="flex-1"
                          @keydown.enter.prevent="addTagFromDraft"
                        />
                        <UButton
                          type="button"
                          color="neutral"
                          variant="outline"
                          icon="i-lucide-plus"
                          :disabled="savePending || !tagDraftInput.trim()"
                          @click="addTagFromDraft"
                        />
                      </div>
                      <div
                        v-if="tagTokens.length"
                        class="flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="(tag, idx) in tagTokens"
                          :key="`tag-token-${idx}`"
                          class="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300"
                        >
                          {{ tag }}
                          <button
                            type="button"
                            class="ml-0.5 flex items-center justify-center rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/40"
                            :disabled="savePending"
                            @click="removeTag(idx)"
                          >
                            <UIcon name="i-lucide-x" class="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                      <p
                        v-else
                        class="text-xs text-gray-400 dark:text-gray-500"
                      >
                        No tags added
                      </p>
                    </div>
                  </UFormField>
                </div>
              </UCard>

              <!-- Instructions -->
              <UCard
                :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div class="flex items-center justify-between gap-3">
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      Instruction Flow
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ editableInstructions.length }}
                    </UBadge>
                  </div>
                </template>

                <div class="space-y-4">
                  <ConsoleRecipesInstructionStepsEditor
                    :model-value="editableInstructions"
                    :disabled="savePending || imageUploading"
                    add-label="Add step"
                    @update:model-value="value => editableInstructions = value"
                  />

                  <UAlert
                    v-if="saveError"
                    color="error"
                    variant="soft"
                    icon="i-lucide-alert-circle"
                    :title="saveError"
                  />

                  <UAlert
                    v-if="showExpertRecipeReminder"
                    color="warning"
                    variant="soft"
                    icon="i-lucide-star"
                    title="Not marked as expert recipe"
                    description="Consider marking this recipe as an expert recipe if it has been professionally curated."
                    :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
                    @close="dismissExpertRecipeReminder"
                  />
                </div>
              </UCard>
            </div>

            <div class="space-y-6">
              <UCard
                :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <div class="flex items-center justify-between gap-3">
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      Image
                    </h2>

                    <UButton
                      type="button"
                      color="neutral"
                      variant="outline"
                      size="sm"
                      icon="i-lucide-upload"
                      :loading="imageUploading"
                      @click="triggerImageUpload"
                    >
                      Upload
                    </UButton>
                  </div>
                </template>

                <div class="space-y-3">
                  <input
                    :key="imageInputKey"
                    ref="imageInput"
                    type="file"
                    accept="image/png,image/jpeg"
                    class="hidden"
                    @change="handleImageSelection"
                  >

                  <div class="overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/60 dark:border-white/10 dark:bg-white/5">
                    <img
                      v-if="previewImageUrl"
                      :src="previewImageUrl"
                      :alt="recipe.title"
                      class="aspect-[4/3] w-full object-cover"
                      referrerpolicy="no-referrer"
                    >
                    <div
                      v-else
                      class="flex aspect-[4/3] items-center justify-center px-5 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No image
                    </div>
                  </div>

                  <UFormField label="Image URL">
                    <UInput
                      v-model="imageUrlInput"
                      placeholder="https://..."
                      class="w-full"
                    />
                  </UFormField>

                  <UAlert
                    v-if="imageError"
                    color="error"
                    variant="soft"
                    icon="i-lucide-alert-circle"
                    :title="imageError"
                  />
                </div>
              </UCard>

              <UCard
                :ui="{ body: ingredientsOpen && ingredientLines.length ? 'p-5 sm:p-6' : 'hidden', header: 'p-5 sm:p-6' }"
                class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
              >
                <template #header>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-3"
                    @click="ingredientsOpen = !ingredientsOpen"
                  >
                    <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                      Ingredients
                    </h2>
                    <div class="flex items-center gap-2">
                      <UBadge
                        color="neutral"
                        variant="outline"
                      >
                        {{ ingredientLines.length }}
                      </UBadge>
                      <UIcon
                        name="i-lucide-chevron-down"
                        class="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500"
                        :class="ingredientsOpen ? 'rotate-180' : ''"
                      />
                    </div>
                  </button>
                </template>

                <div
                  v-if="ingredientLines.length"
                  class="space-y-1.5"
                >
                  <div
                    v-for="(ingredient, index) in ingredientLines"
                    :key="`ingredient-${index}`"
                    class="flex items-start gap-3 rounded-lg border border-gray-200/60 bg-gray-50/60 px-3 py-2 text-sm text-gray-700 dark:border-white/8 dark:bg-white/4 dark:text-gray-200"
                  >
                    <span class="mt-px min-w-[1.25rem] text-center text-xs font-semibold tabular-nums text-gray-400 dark:text-gray-500">
                      {{ index + 1 }}
                    </span>
                    <span>{{ ingredient }}</span>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </template>
      </UPageBody>
    </UPage>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Recipe, RecipeCollectionSuggestion, UpdateRecipeRequest } from '~/services/recipeApi'
import recipeApi from '~/services/recipeApi'
import {
  formatConsoleRecipeIngredient,
  normalizeRecipeImageUrl,
  resolveConsoleRecipeErrorMessage
} from '~/utils/consoleRecipes'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const toast = useToast()

const libraryRoute = '/console/assets/recipes'

const loading = ref(false)
const loadError = ref<string | null>(null)
const savePending = ref(false)
const saveError = ref<string | null>(null)
const imageUploading = ref(false)
const imageError = ref<string | null>(null)

const recipe = ref<Recipe | null>(null)
const editableInstructions = ref<string[]>([])
const imageUrlInput = ref('')
const imageInput = ref<HTMLInputElement | null>(null)
const imageInputKey = ref(0)
const ingredientsOpen = ref(false)
const titleInput = ref('')
const durationInput = ref<number | null>(null)
const sourceIdInput = ref('')
const allergenTokens = ref<string[]>([])
const allergenDraftInput = ref('')
const tagTokens = ref<string[]>([])
const tagDraftInput = ref('')
const sourceInput = ref('')
const sourceIdValue = ref('')
const collectionSuggestions = ref<RecipeCollectionSuggestion[]>([])
const collectionLoading = ref(false)
const showCollectionDropdown = ref(false)
const activeCollectionIndex = ref(-1)
const sourceBoxRef = ref<HTMLElement | null>(null)
let collectionDebounceTimer: ReturnType<typeof setTimeout> | null = null
const expertRecipeInput = ref(false)
const showExpertRecipeReminder = ref(false)
const expertRecipeReminderDismissed = ref(false)
const expertPatchPending = ref(false)

const recipeId = computed(() => {
  const raw = String(route.params.id || '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})

const pageTitle = computed(() => recipe.value?.title || 'Recipe Editor')

useHead({
  title: computed(() => `${pageTitle.value} - Recipes`)
})

useSeoMeta({
  description: 'Wisefood recipe editor for internal recipe management'
})

const breadcrumbItems = computed(() => [
  {
    label: 'Console',
    icon: 'i-lucide-panel-top',
    to: '/console'
  },
  {
    label: 'Asset Manager',
    icon: 'i-lucide-folder-open',
    to: '/console/assets'
  },
  {
    label: 'Recipes',
    icon: 'i-lucide-utensils-crossed',
    to: libraryRoute
  },
  {
    label: recipe.value?.title || recipeId.value,
    icon: 'i-lucide-file-pen-line'
  }
])

const publicRecipeRoute = computed(() => `/recipe-wrangler/${encodeURIComponent(recipeId.value)}`)

const previewImageUrl = computed(() => normalizeRecipeImageUrl(imageUrlInput.value))

function humanizeLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const displayTags = computed(() => {
  const tags = recipe.value?.tags || []
  return tags
    .map(tag => humanizeLabel(String(tag || '').trim()))
    .filter(Boolean)
})

const displayAllergens = computed(() => {
  const allergens = recipe.value?.allergens || []
  return allergens
    .map(allergen => humanizeLabel(String(allergen || '').trim()))
    .filter(Boolean)
})

const ingredientLines = computed(() => {
  return (recipe.value?.ingredients || [])
    .map(ingredient => formatConsoleRecipeIngredient(ingredient))
    .filter(Boolean)
})

const nutriProfile = computed(() => {
  const r = recipe.value
  if (!r) return []

  const fmt = (val: number | null | undefined, unit: string, label: string) =>
    val != null ? { value: `${Math.round(val)}${unit}`, label } : null

  return [
    fmt(r.total_kcal_per_serving, ' kcal', 'energy'),
    fmt(r.total_protein_g_per_serving, 'g', 'protein'),
    fmt(r.total_carbs_g_per_serving, 'g', 'carbs'),
    fmt(r.total_fat_g_per_serving, 'g', 'fat'),
    fmt(r.total_fiber_g_per_serving, 'g', 'fiber'),
    fmt(r.total_sugar_g_per_serving, 'g', 'sugar'),
    fmt(r.total_sodium_mg_per_serving, 'mg', 'sodium'),
  ].filter(Boolean) as { value: string, label: string }[]
})

const hasUnsavedChanges = computed(() => {
  if (!recipe.value) {
    return false
  }

  const currentInstructions = sanitizeInstructions(editableInstructions.value)
  const originalInstructions = sanitizeInstructions(recipe.value.instructions || [])
  const currentImageUrl = imageUrlInput.value.trim()
  const originalImageUrl = String(recipe.value.image_url || '').trim()
  const currentTitle = titleInput.value.trim()
  const originalTitle = String(recipe.value.title || '').trim()
  const currentDuration = durationInput.value ?? null
  const originalDuration = recipe.value.duration ?? null
  const currentSourceId = sourceIdValue.value.trim()
  const originalSourceId = String(recipe.value.source_id || '').trim()
  const currentAllergens = [...allergenTokens.value].sort()
  const originalAllergens = (recipe.value.allergens || []).map(a => String(a || '').trim()).filter(Boolean).sort()
  const currentTags = [...tagTokens.value].sort()
  const originalTags = (recipe.value.tags || []).map(t => String(t || '').trim()).filter(Boolean).sort()

  return JSON.stringify(currentInstructions) !== JSON.stringify(originalInstructions)
    || currentImageUrl !== originalImageUrl
    || currentTitle !== originalTitle
    || currentDuration !== originalDuration
    || currentSourceId !== originalSourceId
    || JSON.stringify(currentAllergens) !== JSON.stringify(originalAllergens)
    || JSON.stringify(currentTags) !== JSON.stringify(originalTags)
})

const editorStatus = computed(() => {
  return hasUnsavedChanges.value
    ? { color: 'warning' as const, label: 'Unsaved changes' }
    : { color: 'success' as const, label: 'Saved' }
})

function sanitizeInstructions(value: string[]) {
  return value
    .map(step => String(step || '').trim())
    .filter(Boolean)
}

function addAllergenFromDraft() {
  const token = allergenDraftInput.value.trim()
  if (!token) return
  const normalized = token.toLowerCase()
  if (!allergenTokens.value.map(a => a.toLowerCase()).includes(normalized)) {
    allergenTokens.value = [...allergenTokens.value, token]
  }
  allergenDraftInput.value = ''
}

function removeAllergen(index: number) {
  allergenTokens.value = allergenTokens.value.filter((_, i) => i !== index)
}

function addTagFromDraft() {
  const token = tagDraftInput.value.trim()
  if (!token) return
  const normalized = token.toLowerCase()
  if (!tagTokens.value.map(t => t.toLowerCase()).includes(normalized)) {
    tagTokens.value = [...tagTokens.value, token]
  }
  tagDraftInput.value = ''
}

function removeTag(index: number) {
  tagTokens.value = tagTokens.value.filter((_, i) => i !== index)
}

async function fetchCollectionSuggestions(q: string) {
  if (!q.trim()) {
    collectionSuggestions.value = []
    showCollectionDropdown.value = false
    return
  }
  collectionLoading.value = true
  try {
    const results = await recipeApi.autocompleteCollections(q.trim())
    collectionSuggestions.value = results
    showCollectionDropdown.value = results.length > 0
    activeCollectionIndex.value = -1
  } catch {
    collectionSuggestions.value = []
    showCollectionDropdown.value = false
  } finally {
    collectionLoading.value = false
  }
}

function handleCollectionInput() {
  sourceIdValue.value = ''
  if (collectionDebounceTimer) clearTimeout(collectionDebounceTimer)
  collectionDebounceTimer = setTimeout(() => {
    void fetchCollectionSuggestions(sourceInput.value)
  }, 200)
}

function selectCollection(suggestion: RecipeCollectionSuggestion) {
  sourceInput.value = suggestion.title
  sourceIdValue.value = suggestion.urn
  collectionSuggestions.value = []
  showCollectionDropdown.value = false
  activeCollectionIndex.value = -1
}

function handleCollectionArrowDown() {
  if (!showCollectionDropdown.value || !collectionSuggestions.value.length) return
  activeCollectionIndex.value = activeCollectionIndex.value < collectionSuggestions.value.length - 1
    ? activeCollectionIndex.value + 1 : 0
}

function handleCollectionArrowUp() {
  if (!showCollectionDropdown.value || !collectionSuggestions.value.length) return
  activeCollectionIndex.value = activeCollectionIndex.value > 0
    ? activeCollectionIndex.value - 1 : collectionSuggestions.value.length - 1
}

function handleCollectionEnter() {
  const idx = activeCollectionIndex.value >= 0 ? activeCollectionIndex.value : 0
  const suggestion = collectionSuggestions.value[idx]
  if (suggestion) selectCollection(suggestion)
}

function handleCollectionClickOutside(event: MouseEvent) {
  if (sourceBoxRef.value && !sourceBoxRef.value.contains(event.target as Node)) {
    showCollectionDropdown.value = false
  }
}

function dismissExpertRecipeReminder() {
  showExpertRecipeReminder.value = false
  expertRecipeReminderDismissed.value = true
}

async function toggleExpertRecipe() {
  if (!recipe.value) return
  const next = !expertRecipeInput.value
  expertPatchPending.value = true
  try {
    const updated = await recipeApi.updateManagedRecipe(recipe.value.recipe_id, { expert_recipe: next })
    recipe.value = updated
    expertRecipeInput.value = next
    if (next) {
      showExpertRecipeReminder.value = false
    }
    toast.add({
      title: next ? 'Marked as expert recipe' : 'Unmarked as expert recipe',
      color: 'success'
    })
  } catch (error) {
    saveError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to update expert recipe status')
  } finally {
    expertPatchPending.value = false
  }
}

function resetWorkingCopy() {
  editableInstructions.value = recipe.value?.instructions?.length
    ? [...recipe.value.instructions]
    : ['']
  imageUrlInput.value = String(recipe.value?.image_url || '').trim()
  titleInput.value = String(recipe.value?.title || '').trim()
  durationInput.value = recipe.value?.duration ?? null
  sourceIdValue.value = String(recipe.value?.source_id || '').trim()
  sourceInput.value = String(recipe.value?.source || recipe.value?.source_id || '').trim()
  allergenTokens.value = (recipe.value?.allergens || [])
    .map(a => String(a || '').trim())
    .filter(Boolean)
  allergenDraftInput.value = ''
  tagTokens.value = (recipe.value?.tags || [])
    .map(t => String(t || '').trim())
    .filter(Boolean)
  tagDraftInput.value = ''
  expertRecipeInput.value = Boolean(recipe.value?.expert_recipe)
  saveError.value = null
  imageError.value = null
  showExpertRecipeReminder.value = false
}

async function loadRecipe() {
  loading.value = true
  loadError.value = null

  try {
    const managedRecipe = await recipeApi.getManagedRecipe(recipeId.value)
    recipe.value = managedRecipe
    resetWorkingCopy()
  } catch (error) {
    recipe.value = null
    loadError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to load recipe')
  } finally {
    loading.value = false
  }
}

function triggerImageUpload() {
  imageInput.value?.click()
}

async function handleImageSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  imageUploading.value = true
  imageError.value = null

  try {
    const uploadedImage = await recipeApi.uploadManagedRecipeImage(file)
    imageUrlInput.value = uploadedImage.image_url

    toast.add({
      title: 'Image uploaded',
      description: 'The recipe now points at the uploaded image. Save changes to persist the link.',
      color: 'success'
    })
  } catch (error) {
    imageError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to upload recipe image')
  } finally {
    imageUploading.value = false
    imageInputKey.value += 1
  }
}

async function saveRecipeEdits() {
  if (!recipe.value) {
    return
  }

  savePending.value = true
  saveError.value = null

  try {
    const nextInstructions = sanitizeInstructions(editableInstructions.value)
    if (!nextInstructions.length) {
      throw new Error('Add at least one instruction before saving.')
    }

    const payload: UpdateRecipeRequest = {}
    const originalInstructions = sanitizeInstructions(recipe.value.instructions || [])
    const nextImageUrl = imageUrlInput.value.trim()
    const originalImageUrl = String(recipe.value.image_url || '').trim()
    const nextTitle = titleInput.value.trim()
    const originalTitle = String(recipe.value.title || '').trim()
    const nextDuration = durationInput.value ?? null
    const originalDuration = recipe.value.duration ?? null
    const nextSourceId = sourceIdValue.value.trim()
    const originalSourceId = String(recipe.value.source_id || '').trim()
    const nextAllergens = [...allergenTokens.value].sort()
    const originalAllergens = (recipe.value.allergens || []).map(a => String(a || '').trim()).filter(Boolean).sort()
    const nextTags = [...tagTokens.value].sort()
    const originalTags = (recipe.value.tags || []).map(t => String(t || '').trim()).filter(Boolean).sort()

    if (JSON.stringify(nextInstructions) !== JSON.stringify(originalInstructions)) {
      payload.instructions = nextInstructions
    }

    if (nextImageUrl !== originalImageUrl) {
      payload.image_url = nextImageUrl
    }

    if (nextTitle && nextTitle !== originalTitle) {
      payload.title = nextTitle
    }

    if (nextDuration !== originalDuration) {
      payload.duration = nextDuration ?? undefined
    }

    if (nextSourceId !== originalSourceId) {
      payload.source_id = nextSourceId || undefined
    }

    if (JSON.stringify(nextAllergens) !== JSON.stringify(originalAllergens)) {
      payload.allergens = nextAllergens
    }

    if (JSON.stringify(nextTags) !== JSON.stringify(originalTags)) {
      payload.tags = nextTags
    }

    if (!Object.keys(payload).length) {
      return
    }

    const updatedRecipe = await recipeApi.updateManagedRecipe(recipe.value.recipe_id, payload)
    recipe.value = updatedRecipe
    resetWorkingCopy()

    toast.add({
      title: 'Recipe updated',
      description: `${updatedRecipe.title} was saved successfully.`,
      color: 'success'
    })

    if (!updatedRecipe.expert_recipe && !expertRecipeReminderDismissed.value) {
      showExpertRecipeReminder.value = true
    }
  } catch (error) {
    saveError.value = resolveConsoleRecipeErrorMessage(error, 'Failed to update recipe')
  } finally {
    savePending.value = false
  }
}

watch(recipeId, () => {
  void loadRecipe()
}, { immediate: true })

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleCollectionClickOutside)
  }
})

onBeforeUnmount(() => {
  if (collectionDebounceTimer) clearTimeout(collectionDebounceTimer)
  if (import.meta.client) {
    document.removeEventListener('click', handleCollectionClickOutside)
  }
})
</script>
