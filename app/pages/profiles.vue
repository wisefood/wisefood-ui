<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
    <!-- Header -->
    <header class="p-6">
      <NuxtLink to="/" class="inline-block">
        <img
          src="/logo.png"
          alt="WISEFOOD"
          class="h-10 w-auto"
        />
      </NuxtLink>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-12 w-12 animate-spin mx-auto mb-4 text-brand-500" />
        <p class="text-gray-400">{{ t('profileSelection.loading') }}</p>
      </div>
    </div>

    <!-- Profile Selection -->
    <div v-else class="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <!-- Header changes based on whether user has profiles -->
      <template v-if="members.length > 0">
        <h1 class="text-3xl sm:text-4xl font-light text-white text-center mb-2">
          {{ t('profileSelection.title.prefix') }} <span class="font-serif text-4xl sm:text-5xl italic text-brand-400">{{ t('profileSelection.title.accentEating') }}</span>
        </h1>
        <p class="text-gray-400 text-center mb-12">
          {{ t('profileSelection.subtitle.withProfiles') }}
        </p>
      </template>
      <template v-else>
        <h1 class="text-3xl sm:text-4xl font-light text-white text-center mb-2">
          {{ t('profileSelection.title.getPrefix') }} <span class="font-serif italic text-brand-400">{{ t('profileSelection.title.accentStarted') }}</span>
        </h1>
        <p class="text-gray-400 text-center mb-12">
          {{ householdStore.hasHousehold ? t('profileSelection.subtitle.createFirstProfile') : t('profileSelection.subtitle.setupHousehold') }}
        </p>
      </template>

      <!-- Profiles Grid: two tiles a row on a phone, a wrapping row above -->
      <div class="grid grid-cols-2 gap-4 w-full sm:flex sm:flex-wrap sm:justify-center sm:gap-6 max-w-4xl">
        <!-- Existing Profiles -->
        <div
          v-for="member in members"
          :key="member.id"
          class="relative"
        >
          <!-- Delete button (only in manage mode). The badge stays 32px; the
               pseudo-element behind it takes the tap from a 44px area. -->
          <button
            v-if="isManaging"
            type="button"
            class="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all duration-200 pointer-fine:hover:scale-110 after:absolute after:-inset-1.5 after:rounded-full after:content-['']"
            :aria-label="t('profileSelection.actions.delete')"
            @click="confirmDeleteMember(member)"
          >
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>

          <button
            type="button"
            class="group w-full sm:w-auto flex flex-col items-center space-y-3 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:bg-white/5"
            :class="{ 'animate-wiggle': isManaging }"
            @click="selectProfile(member)"
          >
            <div class="relative">
              <ProfileAvatar
                v-if="memberAvatars[member.id]"
                :avatar="memberAvatars[member.id]"
                :size="isPhone ? 'lg' : 'xl'"
                class="transition-transform duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/30"
              />
              <div
                v-else
                class="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:ring-4 group-hover:ring-white/30"
              >
                <span class="text-4xl sm:text-5xl font-light text-white">
                  {{ member.name.charAt(0).toUpperCase() }}
                </span>
              </div>

              <!-- Play overlay (only when not managing): revealed on hover,
                   always there for a finger, which has nothing to hover with -->
              <div
                v-if="!isManaging"
                class="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300 flex items-center justify-center opacity-0 pointer-coarse:opacity-100 group-hover:opacity-100"
              >
                <UIcon name="i-lucide-play" class="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>

            <span class="max-w-full break-words text-center text-gray-300 group-hover:text-white font-medium transition-colors text-lg sm:text-xl">
              {{ member.name }}
            </span>

          </button>
        </div>

        <!-- Add Profile Button -->
        <button
          type="button"
          class="group w-full sm:w-auto flex flex-col items-center space-y-3 p-3 sm:p-4 rounded-xl transition-all duration-300 hover:bg-white/5"
          @click="handleAddProfile"
        >
          <div class="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-gray-600 group-hover:border-gray-400 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
            <UIcon name="i-lucide-plus" class="w-12 h-12 sm:w-14 sm:h-14 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </div>
          <span class="max-w-full break-words text-center text-gray-500 group-hover:text-gray-300 font-medium transition-colors text-base sm:text-lg">
            {{ t('profileSelection.actions.addProfile') }}
          </span>
        </button>
      </div>

      <!-- Manage Profiles Link -->
      <button
        v-if="members.length > 0"
        type="button"
        class="mt-12 min-h-11 px-6 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white rounded-md transition-all duration-200"
        @click="toggleManageMode"
      >
        {{ isManaging ? t('profileSelection.actions.done') : t('profileSelection.actions.manageProfiles') }}
      </button>
    </div>

    <!-- Add Member Modal. The fields scroll under a pinned footer, so the
         avatar grid and the Create button are both reachable on a phone. -->
    <UModal
      v-model:open="showAddMember"
      :title="t('profileSelection.modal.addNewProfile')"
      :ui="{ content: 'max-w-md sm:rounded-2xl', footer: 'justify-end gap-3' }"
    >
      <template #body>
        <div class="space-y-5">
          <UFormField :label="t('profileSelection.fields.profileName')" required>
            <UInput
              v-model="newMemberName"
              :placeholder="t('profileSelection.fields.profileNamePlaceholder')"
              size="lg"
              icon="i-lucide-user"
              :disabled="isAddingMember"
            />
          </UFormField>

          <UFormField :label="t('profileSelection.fields.ageGroupOptional')">
            <USelectMenu
              v-model="newMemberAgeGroup"
              :items="ageGroupOptions"
              :placeholder="t('profileSelection.fields.selectAgeGroup')"
              size="lg"
              value-key="value"
              :disabled="isAddingMember"
            />
          </UFormField>

          <ProfileAvatarSelector v-model="newMemberAvatarIndex" />

          <UAlert
            v-if="addMemberError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="addMemberError"
          />
        </div>
      </template>

      <template #footer>
        <UButton
          variant="ghost"
          color="neutral"
          class="pointer-coarse:min-h-11"
          :disabled="isAddingMember"
          @click="showAddMember = false"
        >
          {{ t('profileSelection.actions.cancel') }}
        </UButton>
        <UButton
          color="primary"
          class="pointer-coarse:min-h-11"
          :loading="isAddingMember"
          :disabled="!newMemberName.trim()"
          @click="addMember"
        >
          {{ t('profileSelection.actions.createProfile') }}
        </UButton>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteConfirm"
      :title="t('profileSelection.modal.deleteTitle')"
      :ui="{ content: 'max-w-sm sm:rounded-2xl' }"
    >
      <template #content>
        <div class="p-4 sm:p-6 text-center overflow-y-auto">
          <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-alert-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {{ t('profileSelection.modal.deleteTitle') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ t('profileSelection.modal.deletePromptPrefix') }} <span class="font-medium text-gray-900 dark:text-white">{{ memberToDelete?.name }}</span>? {{ t('profileSelection.modal.deletePromptSuffix') }}
          </p>

          <UAlert
            v-if="deleteError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :title="deleteError"
            class="mb-4 text-left"
          />

          <div class="flex gap-3">
            <UButton
              variant="soft"
              color="neutral"
              class="flex-1 pointer-coarse:min-h-11"
              :disabled="isDeleting"
              @click="cancelDelete"
            >
              {{ t('profileSelection.actions.cancel') }}
            </UButton>
            <UButton
              color="error"
              class="flex-1 pointer-coarse:min-h-11"
              :loading="isDeleting"
              @click="deleteMember"
            >
              {{ t('profileSelection.actions.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Household Setup Wizard -->
    <ProfileHouseholdSetupWizard
      v-if="showSetupWizard"
      @complete="onSetupComplete"
      @skip="onSetupSkip"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useHouseholdStore } from '~/stores/household'
import { useAuthStore } from '~/stores/auth'
import { stringToAvatarConfig, type AvatarConfig } from '~/utils/avatarPresets'
import type { HouseholdMember } from '~/services/householdsApi'

definePageMeta({
  middleware: 'auth',
  layout: false  // Use a blank layout for Netflix-style full page
})

const { t } = useI18n()
const { isPhone } = useViewport()

useHead({
  title: computed(() => t('profileSelection.pageTitle'))
})

const router = useRouter()
const householdStore = useHouseholdStore()
const authStore = useAuthStore()

const loading = ref(true)
const isManaging = ref(false)
const showAddMember = ref(false)
const showSetupWizard = ref(false)
const isAddingMember = ref(false)
const addMemberError = ref<string | null>(null)

// Delete member state
const showDeleteConfirm = ref(false)
const memberToDelete = ref<HouseholdMember | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// New member form
const newMemberName = ref('')
const newMemberAgeGroup = ref<string | undefined>(undefined)
const newMemberAvatarIndex = ref(0)

const ageGroupOptions = computed(() => [
  { label: t('profileSelection.ageGroups.child'), value: 'child' },
  { label: t('profileSelection.ageGroups.teen'), value: 'teen' },
  { label: t('profileSelection.ageGroups.adult'), value: 'adult' },
  { label: t('profileSelection.ageGroups.senior'), value: 'senior' }
])

const members = computed(() => householdStore.householdMembers)

// Compute avatars map to avoid TypeScript issues in template
const memberAvatars = computed(() => {
  const avatars: Record<string, AvatarConfig> = {}
  for (const member of householdStore.householdMembers) {
    if (member.image_url) {
      const avatar = stringToAvatarConfig(member.image_url)
      if (avatar) {
        avatars[member.id] = avatar
      }
    }
  }
  return avatars
})

// Initialize household data on mount
onMounted(async () => {
  // Ensure auth is ready
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // Initialize household store (this also restores selected member from localStorage)
  await householdStore.initialize()

  // Check if user needs to set up household
  if (householdStore.needsHouseholdSetup) {
    showSetupWizard.value = true
    loading.value = false
    return
  }

  // If user already has a selected member (restored from localStorage),
  // redirect them directly to dashboard - they don't need to re-select
  if (householdStore.currentMember) {
    router.push('/dashboard')
    return
  }

  loading.value = false
})

function selectProfile(member: HouseholdMember) {
  if (isManaging.value) {
    // TODO: Open edit modal
    return
  }

  householdStore.selectMember(member)
  router.push('/dashboard')
}

function toggleManageMode() {
  isManaging.value = !isManaging.value
}

function handleAddProfile() {
  // If no household exists, show the setup wizard instead of the add member modal
  if (!householdStore.hasHousehold) {
    showSetupWizard.value = true
    return
  }
  showAddMember.value = true
}

async function addMember() {
  if (!newMemberName.value.trim()) return

  isAddingMember.value = true
  addMemberError.value = null

  try {
    // Store avatar as index reference (e.g., "avatar:0", "avatar:5")
    await householdStore.createMember({
      name: newMemberName.value.trim(),
      age_group: newMemberAgeGroup.value as 'child' | 'teen' | 'adult' | 'senior' | undefined,
      image_url: `avatar:${newMemberAvatarIndex.value}`
    })

    // Reset form and close modal
    newMemberName.value = ''
    newMemberAgeGroup.value = undefined
    newMemberAvatarIndex.value = 0
    showAddMember.value = false
  } catch (err) {
    console.error('[ProfilesPage] Failed to add member:', err)
    addMemberError.value = t('profileSelection.errors.createProfileFailed')
  } finally {
    isAddingMember.value = false
  }
}

function onSetupComplete() {
  showSetupWizard.value = false
  // Refresh household data
  householdStore.fetchHousehold()
}

function onSetupSkip() {
  showSetupWizard.value = false
  // User skipped setup, go to dashboard without profile
  router.push('/dashboard')
}

// Delete member functions
function confirmDeleteMember(member: HouseholdMember) {
  memberToDelete.value = member
  deleteError.value = null
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  memberToDelete.value = null
  deleteError.value = null
}

async function deleteMember() {
  if (!memberToDelete.value) return

  isDeleting.value = true
  deleteError.value = null

  try {
    await householdStore.deleteMember(memberToDelete.value.id)
    showDeleteConfirm.value = false
    memberToDelete.value = null

    // Exit manage mode if no more members
    if (members.value.length === 0) {
      isManaging.value = false
    }
  } catch (err) {
    console.error('[ProfilesPage] Failed to delete member:', err)
    deleteError.value = t('profileSelection.errors.deleteProfileFailed')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* Wiggle animation for manage mode */
@keyframes wiggle {
  0%, 100% { transform: rotate(-1deg); }
  50% { transform: rotate(1deg); }
}

.animate-wiggle {
  animation: wiggle 0.3s ease-in-out infinite;
}
</style>
