<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
    <div class="relative w-full max-w-lg mx-4">
      <!-- Skip button -->
      <button
        v-if="!isSubmitting"
        type="button"
        class="absolute -top-12 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
        @click="handleSkip"
      >
        {{ t('profileSelection.setupWizard.actions.skipForNow') }}
        <UIcon name="i-lucide-x" class="w-4 h-4" />
      </button>

      <!-- Card -->
      <UCard
        class="shadow-2xl"
        :ui="{
          body: { padding: 'sm:p-8 p-6' },
          ring: 'ring-1 ring-white/10',
          rounded: 'rounded-3xl'
        }"
      >
        <!-- Progress indicator -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <div
            v-for="s in totalSteps"
            :key="s"
            class="h-1.5 rounded-full transition-all duration-300"
            :class="s <= step ? 'bg-brand-500 w-8' : 'bg-gray-200 dark:bg-gray-700 w-4'"
          />
        </div>

        <!-- Step 1: Welcome & Household Name -->
        <div v-if="step === 1" class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-home" class="w-8 h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-2">
              {{ t('profileSelection.setupWizard.step1.titlePrefix') }} <span class="font-serif italic text-brand-500 text-3xl">WiseFood</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('profileSelection.setupWizard.step1.subtitle') }}
            </p>
          </div>

          <UFormField :label="t('profileSelection.setupWizard.step1.householdNameLabel')" required>
            <UInput
              v-model="householdName"
              :placeholder="t('profileSelection.setupWizard.step1.householdNamePlaceholder')"
              size="lg"
              icon="i-lucide-home"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField :label="t('profileSelection.setupWizard.step1.countryOptionalLabel')">
            <CountrySelector
              v-model="householdRegion"
              :placeholder="t('profileSelection.setupWizard.step1.countryPlaceholder')"
              :search-placeholder="t('profileSelection.setupWizard.step1.countrySearchPlaceholder')"
              size="lg"
              :disabled="isSubmitting"
            />
            <template #hint>
              <span class="text-xs text-gray-500">{{ t('profileSelection.setupWizard.step1.countryHint') }}</span>
            </template>
          </UFormField>
        </div>

        <!-- Step 2: Create First Member Profile -->
        <div v-else-if="step === 2" class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brandg-100 to-brandg-200 dark:from-brandg-900/40 dark:to-brandg-800/40 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-user-plus" class="w-8 h-8 text-brandg-600 dark:text-brandg-400" />
            </div>
            <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-2">
              {{ t('profileSelection.setupWizard.step2.titlePrefix') }} <span class="font-serif italic text-brandg-500 text-3xl">{{ t('profileSelection.setupWizard.step2.titleAccent') }}</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('profileSelection.setupWizard.step2.subtitle') }}
            </p>
          </div>

          <UFormField :label="t('profileSelection.setupWizard.step2.profileNameLabel')" required>
            <UInput
              v-model="memberName"
              :placeholder="t('profileSelection.setupWizard.step2.profileNamePlaceholder')"
              size="lg"
              icon="i-lucide-user"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField :label="t('profileSelection.setupWizard.step2.ageGroupOptionalLabel')">
            <USelectMenu
              v-model="memberAgeGroup"
              :items="ageGroupOptions"
              :placeholder="t('profileSelection.setupWizard.step2.selectAgeGroupPlaceholder')"
              size="lg"
              value-key="value"
              :disabled="isSubmitting"
            />
          </UFormField>

          <ProfileAvatarSelector v-model="selectedAvatarIndex" />
        </div>

        <!-- Step 3: Dietary Preferences (Optional) -->
        <div v-else-if="step === 3" class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-salad" class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-2">
              {{ t('profileSelection.setupWizard.step3.titlePrefix') }} <span class="font-serif italic text-green-500 text-3xl">{{ t('profileSelection.setupWizard.step3.titleAccent') }}</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('profileSelection.setupWizard.step3.subtitle') }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="diet in dietaryOptions"
              :key="diet.value"
              type="button"
              class="p-4 rounded-xl border-2 transition-all duration-200 text-left"
              :class="selectedDiet === diet.value
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700'"
              :disabled="isSubmitting"
              @click="selectedDiet = diet.value"
            >
              <UIcon :name="diet.icon" class="w-6 h-6 mb-2" :class="selectedDiet === diet.value ? 'text-brand-500' : 'text-gray-400'" />
              <div class="font-medium text-gray-900 dark:text-white text-sm">{{ diet.label }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ diet.description }}</div>
            </button>
          </div>
        </div>

        <!-- Error display -->
        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
          class="mt-4"
        />

        <!-- Navigation buttons -->
        <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UButton
            v-if="step > 1"
            variant="ghost"
            color="gray"
            icon="i-lucide-arrow-left"
            :disabled="isSubmitting"
            @click="step--"
          >
            {{ t('profileSelection.setupWizard.actions.back') }}
          </UButton>
          <div v-else />

          <UButton
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :loading="isSubmitting"
            :disabled="!canProceed"
            @click="handleNext"
          >
            {{ step === totalSteps ? t('profileSelection.setupWizard.actions.completeSetup') : t('profileSelection.setupWizard.actions.continue') }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'

interface Emits {
  (e: 'complete'): void
  (e: 'skip'): void
}

const emit = defineEmits<Emits>()
const { t } = useI18n()

const householdStore = useHouseholdStore()

const step = ref(1)
const totalSteps = 3
const isSubmitting = ref(false)
const error = ref<string | null>(null)

// Step 1: Household data
const householdName = ref('')
const householdRegion = ref<string | undefined>(undefined)

// Step 2: Member data
const memberName = ref('')
const memberAgeGroup = ref<string | undefined>(undefined)
const selectedAvatarIndex = ref(0)

// Step 3: Dietary preferences
const selectedDiet = ref<string>('omnivore')

const ageGroupOptions = computed(() => [
  { label: t('profileSelection.ageGroups.child'), value: 'child' },
  { label: t('profileSelection.ageGroups.teen'), value: 'teen' },
  { label: t('profileSelection.ageGroups.adult'), value: 'adult' },
  { label: t('profileSelection.ageGroups.senior'), value: 'senior' }
])

const dietaryOptions = computed(() => [
  {
    value: 'omnivore',
    label: t('profileSelection.setupWizard.dietary.omnivore.label'),
    description: t('profileSelection.setupWizard.dietary.omnivore.description'),
    icon: 'i-lucide-utensils'
  },
  {
    value: 'vegetarian',
    label: t('profileSelection.setupWizard.dietary.vegetarian.label'),
    description: t('profileSelection.setupWizard.dietary.vegetarian.description'),
    icon: 'i-lucide-carrot'
  },
  {
    value: 'vegan',
    label: t('profileSelection.setupWizard.dietary.vegan.label'),
    description: t('profileSelection.setupWizard.dietary.vegan.description'),
    icon: 'i-lucide-leaf'
  },
  {
    value: 'pescatarian',
    label: t('profileSelection.setupWizard.dietary.pescatarian.label'),
    description: t('profileSelection.setupWizard.dietary.pescatarian.description'),
    icon: 'i-lucide-fish'
  },
  {
    value: 'flexitarian',
    label: t('profileSelection.setupWizard.dietary.flexitarian.label'),
    description: t('profileSelection.setupWizard.dietary.flexitarian.description'),
    icon: 'i-lucide-sprout'
  }
])

const canProceed = computed(() => {
  if (isSubmitting.value) return false

  switch (step.value) {
    case 1:
      return householdName.value.trim().length >= 2
    case 2:
      return memberName.value.trim().length >= 1
    case 3:
      return true // Dietary is optional
    default:
      return false
  }
})

async function handleNext() {
  error.value = null

  if (step.value < totalSteps) {
    step.value++
    return
  }

  // Final step - submit everything
  isSubmitting.value = true

  try {
    // 1. Create household
    const household = await householdStore.createHousehold({
      name: householdName.value.trim(),
      region: householdRegion.value || undefined
    })

    if (!household) {
      throw new Error(t('profileSelection.setupWizard.errors.createHouseholdFailed'))
    }

    // 2. Create member with profile
    // Store avatar as index reference (e.g., "avatar:0", "avatar:5")
    await householdStore.createMember({
      name: memberName.value.trim(),
      age_group: memberAgeGroup.value as 'child' | 'teen' | 'adult' | 'senior' | undefined,
      image_url: `avatar:${selectedAvatarIndex.value}`,
      profile: {
        dietary_groups: [selectedDiet.value as 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'flexitarian'],
        nutritional_preferences: {},
        properties: {}
      }
    })

    emit('complete')
  } catch (err) {
    console.error('[HouseholdSetupWizard] Setup failed:', err)
    error.value = t('profileSelection.setupWizard.errors.genericSubmitFailed')
  } finally {
    isSubmitting.value = false
  }
}

function handleSkip() {
  householdStore.skipSetup()
  emit('skip')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
