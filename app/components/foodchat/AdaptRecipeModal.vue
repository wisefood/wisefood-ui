<template>
  <!--
    RecipeWrangler's adapt assistant, without leaving FoodChat.

    A bottom sheet on a phone and a centred dialog anywhere wider, so Escape,
    the scroll lock and the swipe to dismiss come from the primitive rather
    than a keydown listener on the document. The parent mounts this with
    `v-if` and waits for `close`, which is sent once the shell has animated
    out rather than the instant it was asked to.
  -->
  <DefineBody>
    <!-- Modes -->
    <div
      class="flex flex-wrap gap-1.5 mb-3"
      data-flows="foodchat-adapt-modes"
    >
      <button
        v-for="m in modes"
        :key="m.value"
        type="button"
        :disabled="loading"
        :class="[
          'inline-flex items-center gap-1 px-2.5 py-1 pointer-coarse:min-h-11 pointer-coarse:px-4 rounded-full text-[0.6875rem] pointer-coarse:text-xs font-medium border transition-colors',
          mode === m.value
            ? 'bg-brandp-500 text-white border-brandp-500'
            : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-brandp-400',
          loading ? 'opacity-60 cursor-not-allowed' : ''
        ]"
        @click="setMode(m.value)"
      >
        <UIcon
          :name="m.icon"
          class="w-3 h-3"
        />
        {{ m.label }}
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="py-8 text-center"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-6 h-6 text-brandp-400 animate-spin mx-auto mb-2"
      />
      <p class="text-xs text-gray-400 dark:text-zinc-500">
        {{ t('foodChatHome.adaptModal.loading') }}
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="py-6 text-center space-y-2"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-6 h-6 text-amber-500 mx-auto"
      />
      <p class="text-xs text-gray-500 dark:text-zinc-400">
        {{ error }}
      </p>
      <button
        type="button"
        class="min-h-11 px-3 text-[0.6875rem] pointer-coarse:text-xs text-brandp-500 hover:underline"
        @click="loadAdaptation"
      >
        {{ t('recipeWrangler.detail.adaptation.retry') }}
      </button>
    </div>

    <!-- Result -->
    <div
      v-else-if="result"
      class="space-y-2"
    >
      <RecipesAdaptationResult :adaptation="result">
        <template
          v-if="canSaveAdaptation(result) && householdStore.currentMember?.id"
          #actions
        >
          <div class="flex justify-end">
            <span
              v-if="savedMode === mode"
              class="inline-flex items-center gap-1 text-[0.6875rem] text-emerald-600 dark:text-emerald-400"
            >
              <UIcon
                name="i-lucide-check"
                class="w-3 h-3"
              />
              {{ t('foodChatHome.adaptModal.saved') }}
            </span>
            <button
              v-else
              data-flows="foodchat-adapt-save"
              class="inline-flex items-center gap-1 px-2.5 py-1 pointer-coarse:min-h-11 pointer-coarse:px-4 text-[0.6875rem] pointer-coarse:text-xs rounded-full font-medium transition-colors
                     bg-brandp-500 text-white hover:bg-brandp-600
                     disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
              :disabled="saving"
              @click="save(result)"
            >
              <UIcon
                v-if="saving"
                name="i-lucide-loader-2"
                class="w-3 h-3 animate-spin"
              />
              {{ t('foodChatHome.adaptModal.save') }}
            </button>
          </div>
        </template>
      </RecipesAdaptationResult>
      <p
        v-if="saveError"
        class="text-[0.6875rem] text-red-500 dark:text-red-400"
      >
        {{ saveError }}
      </p>
      <p
        v-if="savedMode === mode"
        class="text-[0.6875rem] font-light text-gray-400 dark:text-zinc-500 leading-snug"
      >
        {{ t('foodChatHome.adaptModal.savedHint') }}
      </p>
    </div>
  </DefineBody>

  <DefineFooter>
    <!-- The full recipe opens beside the chat on a desktop and in place on a
         phone, where a second tab is a place the plan cannot be seen from. -->
    <NuxtLink
      :to="`/recipe-wrangler/${recipeId}`"
      :target="linkTarget"
      class="inline-flex items-center gap-1 min-h-11 text-[0.6875rem] pointer-coarse:text-xs text-gray-400 dark:text-zinc-500 hover:text-brandp-500 dark:hover:text-brandp-400 hover:underline transition-colors"
    >
      {{ t('foodChatHome.adaptModal.openFull') }}
      <UIcon
        name="i-lucide-arrow-up-right"
        class="w-3 h-3"
      />
    </NuxtLink>
    <button
      class="min-h-11 px-3 text-[0.6875rem] pointer-coarse:text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      @click="open = false"
    >
      {{ t('foodChatHome.adaptModal.close') }}
    </button>
  </DefineFooter>

  <UDrawer
    v-if="isPhone"
    v-model:open="open"
    :title="t('foodChatHome.adaptModal.title')"
    :description="recipe?.title || '…'"
    :ui="{
      content: 'max-h-[88dvh]',
      container: 'min-h-0 overflow-hidden gap-3 pb-[max(0.5rem,var(--wf-safe-bottom))]',
      body: 'min-h-0 overflow-y-auto -mx-4 px-4',
      footer: 'shrink-0 flex-row items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-zinc-800'
    }"
    @animation-end="onDrawerAnimationEnd"
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
    :title="t('foodChatHome.adaptModal.title')"
    :description="recipe?.title || '…'"
    :ui="{
      content: 'max-w-md',
      footer: 'justify-between py-1.5'
    }"
    @after:leave="finishClose"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createReusableTemplate } from '@vueuse/core'
import recipeApi, { resolveRecipeRegion, type Recipe, type RecipeAdaptation, type RecipeAdaptationMode } from '~/services/recipeApi'
import memberAdaptedRecipesApi from '~/services/memberAdaptedRecipesApi'
import { useMemberRestrictions } from '~/composables/useMemberRestrictions'
import { adaptedRecipeTitle, buildAdaptedRecipePayload, canSaveAdaptation } from '~/utils/adaptation'
import { useHouseholdStore } from '~/stores/household'

const props = defineProps<{ recipeId: string }>()
const emit = defineEmits<{ close: [], saved: [] }>()

const { t } = useI18n()
const householdStore = useHouseholdStore()
const { isPhone, isCoarsePointer } = useViewport()

const [DefineBody, ReuseBody] = createReusableTemplate()
const [DefineFooter, ReuseFooter] = createReusableTemplate()

const linkTarget = computed(() => isCoarsePointer.value ? undefined : '_blank')

/**
 * Open from the moment it is mounted; the parent decides WHEN it exists.
 *
 * Closing is a hand-off: the primitive animates out first, then `close` tells
 * the parent to unmount this. The timer covers a browser that never fires
 * the end event.
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

const loading = ref(true)
const error = ref<string | null>(null)
const recipe = ref<Recipe | null>(null)
const mode = ref<RecipeAdaptationMode>('nutrition')
const results = ref<Partial<Record<RecipeAdaptationMode, RecipeAdaptation>>>({})
const saving = ref(false)
const savedMode = ref<RecipeAdaptationMode | null>(null)
const saveError = ref<string | null>(null)

const region = computed(() => resolveRecipeRegion(householdStore.currentHousehold?.region))
const result = computed(() => results.value[mode.value] || null)

const modes = computed(() => ([
  { value: 'nutrition' as RecipeAdaptationMode, label: t('recipeWrangler.detail.adaptation.modeNutrition'), icon: 'i-lucide-heart-pulse' },
  { value: 'sustainability' as RecipeAdaptationMode, label: t('recipeWrangler.detail.adaptation.modeSustainability'), icon: 'i-lucide-leaf' },
  { value: 'cost' as RecipeAdaptationMode, label: t('recipeWrangler.detail.adaptation.modeCost'), icon: 'i-lucide-piggy-bank' },
  { value: 'time' as RecipeAdaptationMode, label: t('recipeWrangler.detail.adaptation.modeTime'), icon: 'i-lucide-timer' }
]))

const { loadRestrictions } = useMemberRestrictions()

async function loadAdaptation() {
  const current = mode.value
  loading.value = true
  error.value = null
  try {
    const { allergens, diet } = await loadRestrictions()
    results.value = {
      ...results.value,
      [current]: await recipeApi.getAdaptation(props.recipeId, { mode: current, region: region.value, allergens, diet })
    }
  } catch (err: unknown) {
    error.value = (err as { message?: string })?.message || t('foodChatHome.adaptModal.error')
  } finally {
    loading.value = false
  }
}

function setMode(next: RecipeAdaptationMode) {
  if (loading.value || next === mode.value) return
  mode.value = next
  saveError.value = null
  error.value = null
  if (!results.value[next]) void loadAdaptation()
}

onMounted(async () => {
  // The recipe is only the title and picture of the saved record; a failure to
  // load it must not hide the suggestion.
  void recipeApi.getRecipe(props.recipeId).then((r) => { recipe.value = r }).catch(() => {})
  await loadAdaptation()
})

// Same payload as the RecipeWrangler detail page, so both entry points
// produce identical adapted-version records.
async function save(adaptation: RecipeAdaptation) {
  const memberId = householdStore.currentMember?.id
  if (!memberId || saving.value) return
  saveError.value = null
  saving.value = true
  try {
    const baseTitle = recipe.value?.title || adaptation.original?.title || ''
    await memberAdaptedRecipesApi.saveAdaptedRecipe(
      memberId,
      props.recipeId,
      adaptedRecipeTitle(adaptation, baseTitle, t('recipeWrangler.detail.adaptation.adaptedSuffix')),
      buildAdaptedRecipePayload(adaptation, {
        region: region.value,
        base: { title: baseTitle, image_url: recipe.value?.image_url, nutri_score_label: null }
      })
    )
    savedMode.value = adaptation.mode
    emit('saved')
  } catch (err: unknown) {
    saveError.value = (err as { message?: string })?.message || t('foodChatHome.adaptModal.error')
  } finally {
    saving.value = false
  }
}
</script>
