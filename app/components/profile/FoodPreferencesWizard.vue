<!--
  Food preferences in four short steps: how you eat, what to keep out, what
  you love, what you would rather skip. One profile write at the end.

  The profile page already has an editor for each of these, and they are the
  right tool for changing one thing. They are the wrong tool for starting from
  nothing: four cards, four modals, four saves is a chore nobody finishes at a
  booth. A guest gets this opened for them on the dashboard
  (GuestPreferencesPrompt); anyone can open it from their profile.

  Optional throughout. Every step may be left empty, closing saves nothing,
  and whatever the profile already holds — allergies, likes, the memories
  FoodChat kept — comes back out untouched apart from what was changed here.
-->
<template>
  <UModal
    v-model:open="isOpen"
    :fullscreen="isPhone"
    :dismissible="!isSaving"
    :close="false"
    :title="stepTitle"
    :description="stepSubtitle"
    :ui="{
      overlay: 'bg-gray-900/80 backdrop-blur-sm',
      content: 'sm:max-w-2xl sm:rounded-3xl sm:shadow-2xl'
    }"
  >
    <template #content>
      <!-- Progress and the way out -->
      <div class="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 min-h-14">
        <div
          class="flex items-center gap-2"
          aria-hidden="true"
        >
          <div
            v-for="s in totalSteps"
            :key="s"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="s <= step ? 'bg-brand-500 w-8' : 'bg-gray-200 dark:bg-gray-700 w-4'"
          />
        </div>
        <!-- The way out. Opened by itself on a guest's dashboard it says so
             in words — an X on a dialog nobody asked for reads as an error;
             opened on purpose from the profile page, the X is enough. -->
        <UButton
          v-if="skippable"
          variant="ghost"
          color="neutral"
          size="sm"
          trailing-icon="i-lucide-x"
          class="pointer-coarse:min-h-11"
          :disabled="isSaving"
          @click="close"
        >
          {{ t('profileSelection.setupWizard.actions.skipForNow') }}
        </UButton>
        <UButton
          v-else
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-lucide-x"
          class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
          :disabled="isSaving"
          :aria-label="t('preferencesWizard.actions.close')"
          @click="close"
        />
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 sm:py-8">
        <!-- Smaller on a phone: the food steps also carry a search box, a tab
             row and a grid, and a full-height hero leaves two rows of foods
             visible under the keyboard. -->
        <div class="text-center mb-4 sm:mb-6">
          <div
            class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3 sm:mb-4"
            :class="stepAccent.bg"
          >
            <UIcon
              :name="stepAccent.icon"
              class="w-6 h-6 sm:w-8 sm:h-8"
              :class="stepAccent.text"
            />
          </div>
          <h2 class="text-xl sm:text-2xl font-light text-gray-900 dark:text-white mb-1 sm:mb-2">
            {{ stepTitle }}
          </h2>
          <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {{ stepSubtitle }}
          </p>
        </div>

        <div
          v-if="isLoading"
          class="flex justify-center py-10"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin text-brand-500"
          />
        </div>

        <!-- Guests only: a name for the session, so the greeting and the
             plans stop saying "Guest". Blank keeps it. -->
        <div
          v-else-if="stepKey === 'name'"
          class="max-w-sm mx-auto space-y-3"
        >
          <UFormField :label="t('preferencesWizard.steps.name.label')">
            <UInput
              v-model="memberName"
              :placeholder="t('preferencesWizard.steps.name.placeholder')"
              size="lg"
              icon="i-lucide-user"
              class="w-full"
              autocomplete="given-name"
              :maxlength="60"
              :disabled="isSaving"
              @keyup.enter="handleNext"
            />
          </UFormField>
          <p class="text-center text-xs text-gray-500 dark:text-gray-400">
            {{ t('preferencesWizard.steps.name.hint') }}
          </p>
        </div>

        <!-- How you eat -->
        <div
          v-else-if="stepKey === 'diet'"
          class="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <button
            v-for="diet in dietaryOptions"
            :key="diet.value"
            type="button"
            class="p-4 rounded-xl border-2 transition-all duration-200 text-left"
            :class="selectedDiet === diet.value
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'"
            :aria-pressed="selectedDiet === diet.value"
            :disabled="isSaving"
            @click="selectedDiet = diet.value"
          >
            <UIcon
              :name="diet.icon"
              class="w-6 h-6 mb-2"
              :class="selectedDiet === diet.value ? 'text-brand-500' : 'text-gray-400'"
            />
            <div class="font-medium text-gray-900 dark:text-white text-sm">
              {{ diet.label }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ diet.description }}
            </div>
          </button>
        </div>

        <!-- What to keep out -->
        <div
          v-else-if="stepKey === 'allergies'"
          class="space-y-4"
        >
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              v-for="allergy in allergyChoices"
              :key="allergy.value"
              type="button"
              class="flex items-center gap-3 p-3 min-h-11 rounded-xl border-2 transition-all duration-200 text-left"
              :class="selectedAllergies.includes(allergy.value)
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'"
              :aria-pressed="selectedAllergies.includes(allergy.value)"
              :disabled="isSaving"
              @click="toggleAllergy(allergy.value)"
            >
              <UIcon
                :name="allergy.icon"
                class="w-5 h-5 shrink-0"
                :class="selectedAllergies.includes(allergy.value) ? 'text-red-500' : 'text-gray-400'"
              />
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ allergy.label }}</span>
              <UIcon
                v-if="selectedAllergies.includes(allergy.value)"
                name="i-lucide-check"
                class="w-4 h-4 ml-auto shrink-0 text-red-500"
              />
            </button>
          </div>
          <p class="text-center text-xs text-gray-500 dark:text-gray-400">
            {{ t('preferencesWizard.steps.allergies.hint') }}
          </p>
        </div>

        <!-- Likes, then dislikes: the foods, one list at a time -->
        <div
          v-else
          class="space-y-4"
        >
          <UInput
            v-model="foodSearch"
            :placeholder="t('preferencesWizard.search')"
            icon="i-lucide-search"
            size="lg"
            class="w-full"
          />

          <div
            v-if="!foodSearch.trim()"
            class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
          >
            <UButton
              v-for="cat in foodCategories"
              :key="cat.id"
              :variant="selectedCategory === cat.id ? 'solid' : 'soft'"
              :color="selectedCategory === cat.id ? 'primary' : 'neutral'"
              size="sm"
              class="shrink-0 pointer-coarse:min-h-11"
              @click="selectedCategory = cat.id"
            >
              <UIcon
                :name="cat.icon"
                class="w-4 h-4 mr-1"
              />
              {{ categoryLabel(cat) }}
            </UButton>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="food in filteredFoods"
              :key="food.id"
              type="button"
              class="flex items-center gap-2 p-3 min-h-11 rounded-xl border-2 transition-all duration-200 text-left"
              :class="[
                isPicked(food.id)
                  ? listAccent.picked
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                isOnOtherList(food.id) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
              :aria-pressed="isPicked(food.id)"
              :disabled="isSaving || isOnOtherList(food.id)"
              :title="isOnOtherList(food.id) ? t('preferencesWizard.onOtherList') : undefined"
              @click="toggleFood(food.id)"
            >
              <UIcon
                :name="food.icon"
                class="w-5 h-5 shrink-0"
                :class="isPicked(food.id) ? listAccent.text : 'text-gray-400'"
              />
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ foodLabel(food.id) }}</span>
              <UIcon
                v-if="isPicked(food.id)"
                name="i-lucide-check"
                class="w-4 h-4 ml-auto shrink-0"
                :class="listAccent.text"
              />
            </button>
          </div>

          <p
            v-if="filteredFoods.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            {{ t('preferencesWizard.noFoods') }}
          </p>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
          class="mt-4"
        />
      </div>

      <!-- Navigation, pinned below the scrolling step and clear of the
           phone's home indicator -->
      <div class="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-[max(1rem,var(--wf-safe-bottom))]">
        <!-- Back keeps only its arrow on a phone, so the count and Continue
             fit beside it on one row. -->
        <UButton
          v-if="step > 1"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="pointer-coarse:min-h-11 pointer-coarse:min-w-11 justify-center"
          :aria-label="t('preferencesWizard.actions.back')"
          :disabled="isSaving"
          @click="step--"
        >
          <span class="hidden sm:inline">{{ t('preferencesWizard.actions.back') }}</span>
        </UButton>
        <div v-else />

        <div class="flex items-center gap-3">
          <span
            v-if="selectionSummary"
            class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
          >
            {{ selectionSummary }}
          </span>
          <UButton
            color="primary"
            :trailing-icon="step === totalSteps ? 'i-lucide-check' : 'i-lucide-arrow-right'"
            class="pointer-coarse:min-h-11"
            :loading="isSaving"
            :disabled="isLoading"
            @click="handleNext"
          >
            {{ step === totalSteps ? t('preferencesWizard.actions.save') : t('preferencesWizard.actions.continue') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { allergenLabelKey, normalizeAllergens } from '~/utils/allergens'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'
import { track } from '~/composables/useTelemetry'
import householdsApi, { GUEST_MEMBER_NAME, type MemberProfile } from '~/services/householdsApi'
import {
  allergyOptions,
  foodCategories,
  getCompatibleFoods,
  getFoodById,
  getFoodsByCategory,
  type DietaryGroup,
  type FoodCategory
} from '~/utils/foodPreferences'

const props = withDefaults(defineProps<{
  memberId: string
  /** Where it was opened from; recorded with the completion event. */
  source: 'auto' | 'profile'
  /** Opened uninvited: the header offers "Skip for now" instead of an X. */
  skippable?: boolean
  /**
   * Start by asking what to call them. For a guest, whose member is named
   * "Guest" until they say otherwise; a blank answer keeps that.
   */
  askName?: boolean
}>(), {
  skippable: false,
  askName: false
})

const emit = defineEmits<{
  complete: [profile: MemberProfile]
  /** Closed without saving. */
  dismiss: []
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const { t, te } = useI18n()
const { isPhone } = useViewport()
const householdStore = useHouseholdStore()

type StepKey = 'name' | 'diet' | 'allergies' | 'likes' | 'dislikes'
const STEP_KEYS = computed<StepKey[]>(() => (props.askName
  ? ['name', 'diet', 'allergies', 'likes', 'dislikes']
  : ['diet', 'allergies', 'likes', 'dislikes']))

const step = ref(1)
const totalSteps = computed(() => STEP_KEYS.value.length)
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const existing = ref<MemberProfile | null>(null)
const memberName = ref('')
const initialMemberName = ref('')
const initialDiet = ref<DietaryGroup | null>(null)
const selectedDiet = ref<DietaryGroup>('omnivore')
const selectedAllergies = ref<string[]>([])
const likes = ref<string[]>([])
const dislikes = ref<string[]>([])
const foodSearch = ref('')
const selectedCategory = ref('proteins')
let savedThisRun = false

/*
 * Start from what the profile already says, so reopening this is a review
 * rather than a blank form. A member with no profile row yet gets a 404 from
 * the API; that is the "nothing set" case, not an error.
 */
async function start() {
  step.value = 1
  error.value = null
  foodSearch.value = ''
  selectedCategory.value = 'proteins'
  savedThisRun = false
  isLoading.value = true
  try {
    const response = await householdsApi.getMemberProfile(props.memberId)
    existing.value = response.result ?? null
  } catch {
    existing.value = null
  }
  if (props.askName) {
    try {
      const member = (await householdsApi.getMember(props.memberId)).result
      initialMemberName.value = member?.name ?? ''
      // The placeholder is not a name they chose; start blank rather than
      // asking them to delete "Guest" first.
      memberName.value = initialMemberName.value === GUEST_MEMBER_NAME ? '' : initialMemberName.value
    } catch {
      initialMemberName.value = ''
      memberName.value = ''
    }
  }
  const diet = existing.value?.dietary_groups?.[0] ?? null
  selectedDiet.value = diet ?? 'omnivore'
  initialDiet.value = diet
  // Folded, so an older `dairy` pre-selects the Milk chip and is written
  // back as `milk`.
  selectedAllergies.value = normalizeAllergens(existing.value?.allergies ?? [])
  likes.value = [...(existing.value?.nutritional_preferences?.food_likes ?? [])]
  dislikes.value = [...(existing.value?.nutritional_preferences?.food_dislikes ?? [])]
  isLoading.value = false
}

// `wasOpen` is undefined on the immediate run, so mounting closed is not a
// dismissal — the nudge that hosts this would otherwise be waved off before
// anyone saw it.
watch(isOpen, (open, wasOpen) => {
  if (open) {
    void start()
  } else if (wasOpen && !savedThisRun) {
    emit('dismiss')
  }
}, { immediate: true })

const DIET_ICONS: Record<DietaryGroup, string> = {
  omnivore: 'i-lucide-utensils',
  vegetarian: 'i-lucide-carrot',
  vegan: 'i-lucide-leaf',
  pescatarian: 'i-lucide-fish',
  flexitarian: 'i-lucide-sprout'
}

const dietaryOptions = computed(() =>
  (Object.keys(DIET_ICONS) as DietaryGroup[]).map(value => ({
    value,
    label: t(`profileSelection.setupWizard.dietary.${value}.label`),
    description: t(`profileSelection.setupWizard.dietary.${value}.description`),
    icon: DIET_ICONS[value]
  }))
)

const allergyChoices = computed(() =>
  allergyOptions.map(option => ({
    ...option,
    label: t(allergenLabelKey(option.value))
  }))
)

const STEP_ACCENTS: Record<StepKey, { icon: string, bg: string, text: string }> = {
  name: {
    icon: 'i-lucide-user',
    bg: 'from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40',
    text: 'text-brand-600 dark:text-brand-400'
  },
  diet: {
    icon: 'i-lucide-salad',
    bg: 'from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40',
    text: 'text-green-600 dark:text-green-400'
  },
  allergies: {
    icon: 'i-lucide-shield-alert',
    bg: 'from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40',
    text: 'text-red-600 dark:text-red-400'
  },
  likes: {
    icon: 'i-lucide-heart',
    bg: 'from-pink-100 to-pink-200 dark:from-pink-900/40 dark:to-pink-800/40',
    text: 'text-pink-600 dark:text-pink-400'
  },
  dislikes: {
    icon: 'i-lucide-ban',
    bg: 'from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40',
    text: 'text-orange-600 dark:text-orange-400'
  }
}

const stepKey = computed<StepKey>(() => STEP_KEYS.value[step.value - 1] ?? 'diet')
const stepTitle = computed(() => t(`preferencesWizard.steps.${stepKey.value}.title`))
const stepSubtitle = computed(() => t(`preferencesWizard.steps.${stepKey.value}.subtitle`))
const stepAccent = computed(() => STEP_ACCENTS[stepKey.value])

// Likes are pink and dislikes orange, as on the profile page.
const listAccent = computed(() => stepKey.value === 'likes'
  ? { picked: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-500' }
  : { picked: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-500' })

const activeList = computed(() => (stepKey.value === 'likes' ? likes : dislikes))
const otherList = computed(() => (stepKey.value === 'likes' ? dislikes : likes))

/*
 * A search looks across every category — someone typing "salmon" should not
 * have to know it lives under Seafood. Browsing stays within the tab.
 */
const filteredFoods = computed(() => {
  const query = foodSearch.value.trim().toLowerCase()
  if (query) {
    return getCompatibleFoods([selectedDiet.value]).filter(food =>
      foodLabel(food.id).toLowerCase().includes(query)
    )
  }
  return getFoodsByCategory(selectedCategory.value, [selectedDiet.value])
})

const selectionSummary = computed(() => {
  switch (stepKey.value) {
    case 'allergies':
      return t('preferencesWizard.selected', { count: selectedAllergies.value.length })
    case 'likes':
      return t('preferencesWizard.selected', { count: likes.value.length })
    case 'dislikes':
      return t('preferencesWizard.selected', { count: dislikes.value.length })
    default:
      return ''
  }
})

function foodLabel(foodId: string): string {
  const key = `myProfile.foodItems.${foodId}`
  return te(key) ? t(key) : (getFoodById(foodId)?.name ?? foodId)
}

function categoryLabel(category: FoodCategory): string {
  const key = `myProfile.foodCategories.${category.id}`
  return te(key) ? t(key) : category.name
}

function isPicked(foodId: string): boolean {
  return activeList.value.value.includes(foodId)
}

function isOnOtherList(foodId: string): boolean {
  return otherList.value.value.includes(foodId)
}

function toggleFood(foodId: string) {
  if (isOnOtherList(foodId)) return
  const list = activeList.value
  list.value = list.value.includes(foodId)
    ? list.value.filter(id => id !== foodId)
    : [...list.value, foodId]
}

function toggleAllergy(value: string) {
  selectedAllergies.value = selectedAllergies.value.includes(value)
    ? selectedAllergies.value.filter(v => v !== value)
    : [...selectedAllergies.value, value]
}

function handleNext() {
  error.value = null
  if (step.value < totalSteps.value) {
    step.value++
    foodSearch.value = ''
    return
  }
  void save()
}

async function save() {
  isSaving.value = true
  error.value = null
  try {
    // A diet they had set and did not touch is kept as it was, even if it
    // was more than one group; the wizard only offers one.
    const keepDiet = initialDiet.value !== null
      && selectedDiet.value === initialDiet.value
      && (existing.value?.dietary_groups?.length ?? 0) > 0
    const payload: MemberProfile = {
      nutritional_preferences: {
        ...(existing.value?.nutritional_preferences ?? {}),
        food_likes: likes.value,
        food_dislikes: dislikes.value
      },
      dietary_groups: keepDiet ? existing.value?.dietary_groups : [selectedDiet.value],
      allergies: selectedAllergies.value,
      properties: existing.value?.properties ?? {}
    }
    await householdStore.updateMemberProfile(props.memberId, payload)

    // The name goes through the store so the selected member — and with it
    // the dashboard greeting — updates in place. After the preferences: a
    // failure here costs a retry, not the answers just given.
    const newName = memberName.value.trim()
    const renamed = props.askName && newName.length > 0 && newName !== initialMemberName.value
    if (renamed) {
      await householdStore.updateMember(props.memberId, { name: newName })
    }

    track('preferences.completed', {
      source: props.source,
      diet: selectedDiet.value,
      allergies: selectedAllergies.value.length,
      likes: likes.value.length,
      dislikes: dislikes.value.length,
      named: renamed
    })
    savedThisRun = true
    isOpen.value = false
    emit('complete', payload)
  } catch (err) {
    console.error('[FoodPreferencesWizard] Save failed:', err)
    error.value = t('preferencesWizard.failed')
  } finally {
    isSaving.value = false
  }
}

function close() {
  if (isSaving.value) return
  isOpen.value = false
}
</script>
