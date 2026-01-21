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
        Skip for now
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
              Welcome to <span class="font-serif italic text-brand-500 text-3xl">WiseFood</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Let's set up your household to personalize your experience
            </p>
          </div>

          <UFormField label="Household Name" required>
            <UInput
              v-model="householdName"
              placeholder="e.g., The Smith Family"
              size="lg"
              icon="i-lucide-home"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField label="Country (optional)">
            <CountrySelector
              v-model="householdRegion"
              placeholder="Select your country"
              search-placeholder="Search countries..."
              size="lg"
              :disabled="isSubmitting"
            />
            <template #hint>
              <span class="text-xs text-gray-500">Helps us suggest regional recipes and dietary guidelines</span>
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
              Create Your <span class="font-serif italic text-brandg-500 text-3xl">Profile</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              Add yourself as the first member of your household
            </p>
          </div>

          <UFormField label="Profile Name" required>
            <UInput
              v-model="memberName"
              placeholder="e.g., John, Mom, Dad"
              size="lg"
              icon="i-lucide-user"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField label="Age Group (optional)">
            <USelectMenu
              v-model="memberAgeGroup"
              :items="ageGroupOptions"
              placeholder="Select age group"
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
              Dietary <span class="font-serif italic text-green-500 text-3xl">Preferences</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              This helps us personalize recipe suggestions (optional)
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
            Back
          </UButton>
          <div v-else />

          <UButton
            color="primary"
            trailing-icon="i-lucide-arrow-right"
            :loading="isSubmitting"
            :disabled="!canProceed"
            @click="handleNext"
          >
            {{ step === totalSteps ? 'Complete Setup' : 'Continue' }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { avatarPresets } from '~/utils/avatarPresets'
import { useHouseholdStore } from '~/stores/household'

interface Emits {
  (e: 'complete'): void
  (e: 'skip'): void
}

const emit = defineEmits<Emits>()

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

const ageGroupOptions = [
  { label: 'Child (0-12)', value: 'child' },
  { label: 'Teen (13-19)', value: 'teen' },
  { label: 'Adult (20-64)', value: 'adult' },
  { label: 'Senior (65+)', value: 'senior' }
]

const dietaryOptions = [
  { value: 'omnivore', label: 'Omnivore', description: 'Eats everything', icon: 'i-lucide-utensils' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat', icon: 'i-lucide-carrot' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only', icon: 'i-lucide-leaf' },
  { value: 'pescatarian', label: 'Pescatarian', description: 'Fish & plants', icon: 'i-lucide-fish' },
  { value: 'flexitarian', label: 'Flexitarian', description: 'Mostly plant-based', icon: 'i-lucide-sprout' }
]

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
      throw new Error('Failed to create household')
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
    error.value = 'Something went wrong. Please try again.'
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
