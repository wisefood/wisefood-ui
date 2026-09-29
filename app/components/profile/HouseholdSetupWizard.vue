<template>
  <!-- A dialog rather than a page overlay. On a phone it fills the screen so
       the steps scroll inside it while Continue stays pinned at the bottom; on
       a wider screen it is the same card, centred, scrolling the same way.
       There is no household yet to fall back to, so clicking outside does
       nothing and Skip is the way out.

       Two modes. `create` is a new account with nothing yet: the wizard makes
       the household and its first member. `claim` is a guest who kept their
       account: the household and member already exist, still called "Guest
       Household" and "Guest", so the same three steps edit them in place —
       prefilled with whatever the guest had already changed — and the
       gateway's onboarding flag is closed at the end so this runs once. -->
  <UModal
    :open="true"
    :fullscreen="isPhone"
    :dismissible="false"
    :close="false"
    :title="modalTitle"
    :description="modalDescription"
    :ui="{
      overlay: 'bg-gray-900/80 backdrop-blur-sm',
      content: 'sm:max-w-lg sm:rounded-3xl sm:shadow-2xl'
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
        <UButton
          v-if="!isSubmitting"
          variant="ghost"
          color="neutral"
          size="sm"
          trailing-icon="i-lucide-x"
          class="pointer-coarse:min-h-11"
          @click="handleSkip"
        >
          {{ isClaim ? t('profileSelection.setupWizard.claim.actions.skip') : t('profileSelection.setupWizard.actions.skipForNow') }}
        </UButton>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8">
        <!-- Step 1: Welcome & Household Name -->
        <div v-if="step === 1" class="space-y-6">
          <div class="text-center">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center mx-auto mb-4">
              <UIcon name="i-lucide-home" class="w-8 h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 class="text-2xl font-light text-gray-900 dark:text-white mb-2">
              <template v-if="isClaim">
                {{ t('profileSelection.setupWizard.claim.step1.titlePrefix') }} <span class="font-serif italic text-brand-500 text-3xl">{{ t('profileSelection.setupWizard.claim.step1.titleAccent') }}</span>
              </template>
              <template v-else>
                {{ t('profileSelection.setupWizard.step1.titlePrefix') }} <span class="font-serif italic text-brand-500 text-3xl">WiseFood</span>
              </template>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ isClaim ? t('profileSelection.setupWizard.claim.step1.subtitle') : t('profileSelection.setupWizard.step1.subtitle') }}
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
            <template #hint>
              <span class="text-xs text-gray-500">{{ t('profileSelection.setupWizard.step1.householdNameHint') }}</span>
            </template>
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
              {{ isClaim ? t('profileSelection.setupWizard.claim.step2.titlePrefix') : t('profileSelection.setupWizard.step2.titlePrefix') }} <span class="font-serif italic text-brandg-500 text-3xl">{{ isClaim ? t('profileSelection.setupWizard.claim.step2.titleAccent') : t('profileSelection.setupWizard.step2.titleAccent') }}</span>
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              {{ isClaim ? t('profileSelection.setupWizard.claim.step2.subtitle') : t('profileSelection.setupWizard.step2.subtitle') }}
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

          <UFormField :label="t('profileSelection.setupWizard.step2.genderOptionalLabel')">
            <USelectMenu
              v-model="memberGender"
              :items="genderOptions"
              :placeholder="t('profileSelection.setupWizard.step2.selectGenderPlaceholder')"
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
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
          class="mt-4"
        />
      </div>

      <!-- Navigation buttons, pinned below the scrolling step and kept clear
           of the phone's home indicator -->
      <div class="flex items-center justify-between gap-3 px-4 sm:px-6 pt-4 pb-[max(1rem,var(--wf-safe-bottom))]">
        <UButton
          v-if="step > 1"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="pointer-coarse:min-h-11"
          :disabled="isSubmitting"
          @click="step--"
        >
          {{ t('profileSelection.setupWizard.actions.back') }}
        </UButton>
        <div v-else />

        <UButton
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="pointer-coarse:min-h-11"
          :loading="isSubmitting"
          :disabled="!canProceed"
          @click="handleNext"
        >
          {{ step === totalSteps ? finalActionLabel : t('profileSelection.setupWizard.actions.continue') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'
import { useAuthStore } from '~/stores/auth'
import { track } from '~/composables/useTelemetry'
import householdsApi, {
  GUEST_HOUSEHOLD_NAME,
  GUEST_MEMBER_NAME,
  type Gender,
  type HouseholdMember,
  type MemberProfile
} from '~/services/householdsApi'
import { avatarPresets } from '~/utils/avatarPresets'

type DietaryGroup = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'flexitarian'
type AgeGroup = 'child' | 'teen' | 'adult' | 'senior'

const props = withDefaults(defineProps<{
  /** `create` makes a household; `claim` edits the one a guest was given. */
  mode?: 'create' | 'claim'
}>(), {
  mode: 'create'
})

const emit = defineEmits<{
  complete: []
  skip: []
}>()
const { t } = useI18n()
const { isPhone } = useViewport()

const householdStore = useHouseholdStore()
const authStore = useAuthStore()

const isClaim = computed(() => props.mode === 'claim')

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
const memberGender = ref<Gender | undefined>(undefined)
const selectedAvatarIndex = ref(0)

// Step 3: Dietary preferences
const selectedDiet = ref<string>('omnivore')

/*
 * Claim mode edits what is already there. The member is the one the guest
 * was provisioned with — still called "Guest" unless they renamed it — or,
 * if they made more, the first; the profile is fetched so gender and diet
 * start from what they set rather than from the defaults.
 */
const claimMember = computed<HouseholdMember | null>(() => {
  if (!isClaim.value) return null
  const members = householdStore.householdMembers
  return members.find(m => m.name === GUEST_MEMBER_NAME) ?? members[0] ?? null
})
const existingProfile = ref<MemberProfile | null>(null)
const initialDiet = ref<string | null>(null)

function avatarIndexOf(imageUrl: string | undefined): number {
  const value = imageUrl?.startsWith('avatar:') ? Number.parseInt(imageUrl.slice(7), 10) : Number.NaN
  return Number.isInteger(value) && value >= 0 && value < avatarPresets.length ? value : 0
}

/** A first name to offer where the member is still called "Guest". */
function accountFirstName(): string {
  const user = authStore.currentUser
  const given = user?.given_name?.trim()
  if (given) return given
  return user?.name?.trim().split(/\s+/)[0] ?? ''
}

async function prefillFromClaim() {
  const household = householdStore.currentHousehold
  if (household) {
    householdName.value = household.name === GUEST_HOUSEHOLD_NAME ? '' : household.name
    householdRegion.value = household.region || undefined
  }

  const member = claimMember.value
  if (!member) return
  memberName.value = member.name === GUEST_MEMBER_NAME ? accountFirstName() : member.name
  memberAgeGroup.value = member.age_group
  selectedAvatarIndex.value = avatarIndexOf(member.image_url)

  try {
    const response = await householdsApi.getMemberProfile(member.id)
    existingProfile.value = response.result ?? null
  } catch {
    // No profile row yet — the guest never opened their profile page.
    existingProfile.value = null
  }
  const gender = existingProfile.value?.nutritional_preferences?.gender
  if (gender) memberGender.value = gender
  const diet = existingProfile.value?.dietary_groups?.[0]
  if (diet) {
    selectedDiet.value = diet
    initialDiet.value = diet
  }
}

onMounted(() => {
  if (isClaim.value) void prefillFromClaim()
})

// What a screen reader hears the dialog called: the visible heading of the
// current step, in plain text. The dialog renders it hidden because the step
// draws its own heading with the accent styling.
const modalTitle = computed(() => {
  switch (step.value) {
    case 1:
      return isClaim.value
        ? `${t('profileSelection.setupWizard.claim.step1.titlePrefix')} ${t('profileSelection.setupWizard.claim.step1.titleAccent')}`
        : `${t('profileSelection.setupWizard.step1.titlePrefix')} WiseFood`
    case 2:
      return isClaim.value
        ? `${t('profileSelection.setupWizard.claim.step2.titlePrefix')} ${t('profileSelection.setupWizard.claim.step2.titleAccent')}`
        : `${t('profileSelection.setupWizard.step2.titlePrefix')} ${t('profileSelection.setupWizard.step2.titleAccent')}`
    default:
      return `${t('profileSelection.setupWizard.step3.titlePrefix')} ${t('profileSelection.setupWizard.step3.titleAccent')}`
  }
})
const modalDescription = computed(() => {
  if (isClaim.value && step.value < 3) return t(`profileSelection.setupWizard.claim.step${step.value}.subtitle`)
  return t(`profileSelection.setupWizard.step${step.value}.subtitle`)
})
const finalActionLabel = computed(() => isClaim.value
  ? t('profileSelection.setupWizard.claim.actions.complete')
  : t('profileSelection.setupWizard.actions.completeSetup'))

const ageGroupOptions = computed(() => [
  { label: t('profileSelection.ageGroups.child'), value: 'child' },
  { label: t('profileSelection.ageGroups.teen'), value: 'teen' },
  { label: t('profileSelection.ageGroups.adult'), value: 'adult' },
  { label: t('profileSelection.ageGroups.senior'), value: 'senior' }
])

const genderOptions = computed(() => [
  { label: t('profileSelection.genders.female'), value: 'female' },
  { label: t('profileSelection.genders.male'), value: 'male' },
  { label: t('profileSelection.genders.other'), value: 'other' },
  { label: t('profileSelection.genders.prefer_not_to_say'), value: 'prefer_not_to_say' }
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
    if (isClaim.value) {
      await submitClaim()
    } else {
      await submitCreate()
    }
    track('onboarding.completed', { mode: props.mode })
    emit('complete')
  } catch (err) {
    console.error('[HouseholdSetupWizard] Setup failed:', err)
    error.value = isClaim.value
      ? t('profileSelection.setupWizard.claim.errors.updateFailed')
      : t('profileSelection.setupWizard.errors.genericSubmitFailed')
  } finally {
    isSubmitting.value = false
  }
}

async function submitCreate() {
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
    age_group: memberAgeGroup.value as AgeGroup | undefined,
    image_url: `avatar:${selectedAvatarIndex.value}`,
    profile: {
      dietary_groups: [selectedDiet.value as DietaryGroup],
      // Gender rides in the nutritional_preferences blob (no dedicated column);
      // only include it when the member actually picked one.
      nutritional_preferences: memberGender.value ? { gender: memberGender.value } : {},
      properties: {}
    }
  })
}

/*
 * Three writes, in the order that fails safest. The member and the profile go
 * first; the household — whose PATCH also closes the onboarding flag — goes
 * last, so a failure part-way leaves the flag open and the wizard runs again
 * next time, prefilled with whatever did land. The other order could mark
 * the setup done with "Guest" still on the profile.
 */
async function submitClaim() {
  const member = claimMember.value
  const details = {
    name: memberName.value.trim(),
    age_group: memberAgeGroup.value as AgeGroup | undefined,
    image_url: `avatar:${selectedAvatarIndex.value}`
  }
  const genderPatch = memberGender.value ? { gender: memberGender.value } : {}
  let saved: HouseholdMember | undefined

  if (member) {
    saved = await householdStore.updateMember(member.id, details)

    // Everything the guest already had on the profile (allergies, likes, the
    // memories FoodChat kept) rides along untouched; only what this wizard
    // asked about is written. A diet they had set and did not change is kept
    // as they had it, even if it was more than one group.
    const existing = existingProfile.value
    const keepDiet = initialDiet.value !== null
      && selectedDiet.value === initialDiet.value
      && (existing?.dietary_groups?.length ?? 0) > 0
    await householdStore.updateMemberProfile(member.id, {
      nutritional_preferences: { ...(existing?.nutritional_preferences ?? {}), ...genderPatch },
      dietary_groups: keepDiet ? existing?.dietary_groups : [selectedDiet.value as DietaryGroup],
      allergies: existing?.allergies ?? [],
      properties: existing?.properties ?? {}
    })
  } else {
    // A guest who erased every profile before claiming: nothing to edit, so
    // make one, exactly as create mode would.
    saved = await householdStore.createMember({
      ...details,
      profile: {
        dietary_groups: [selectedDiet.value as DietaryGroup],
        nutritional_preferences: genderPatch,
        properties: {}
      }
    })
  }

  await householdStore.resolveClaimSetup('complete', {
    name: householdName.value.trim(),
    region: householdRegion.value || undefined
  })

  // This member is theirs; no need to pick it from the tiles afterwards.
  const selected = saved ?? (member ? { ...member, ...details } : null)
  if (selected) householdStore.selectMember(selected)
}

async function handleSkip() {
  if (isClaim.value) {
    // Recorded server-side so the wizard does not come back on the next
    // sign-in; the names can still be changed from the profile page. If the
    // write fails they simply see this once more — not worth an error.
    try {
      await householdStore.resolveClaimSetup('skipped')
    } catch (err) {
      console.warn('[HouseholdSetupWizard] Skip was not recorded:', err)
    }
    track('onboarding.skipped', { mode: props.mode })
    emit('skip')
    return
  }
  householdStore.skipSetup()
  track('onboarding.skipped', { mode: props.mode })
  emit('skip')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}
</style>
