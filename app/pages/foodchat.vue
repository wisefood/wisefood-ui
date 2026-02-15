<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div class="flex items-center justify-between">
          <NuxtLink
            to="/dashboard"
            class="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            <span class="text-sm font-medium hidden sm:inline">Back to Dashboard</span>
          </NuxtLink>
        </div>
        <div class="mt-3 sm:mt-4">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-light text-zinc-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-brandp-500 dark:text-brandp-400 text-3xl sm:text-4xl md:text-5xl">FoodChat</span>
          </h1>
          <p class="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-300 font-light">
            Describe what you'd like to eat and get a personalised meal plan instantly
          </p>
        </div>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      <!-- Input bar — hidden while generating, slides up when content appears -->
      <div
        v-show="!sending"
        class="transition-all duration-700 ease-out"
        :class="hasMealPlans ? 'mb-8' : 'mb-12 mt-8 sm:mt-16'"
      >
        <form class="flex items-end gap-4" @submit.prevent="handleSend">
          <textarea
            ref="inputRef"
            v-model="inputText"
            rows="1"
            :disabled="sending"
            :placeholder="hasMealPlans ? 'Modify your meal plan — e.g. swap lunch for something lighter...' : 'Describe your ideal meals — e.g. high-protein, Mediterranean style...'"
            class="flex-1 resize-none overflow-hidden bg-transparent border-b-2 border-zinc-200 dark:border-zinc-700 px-2 py-3.5 text-base text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brandp-500 dark:focus:border-brandp-400 disabled:opacity-40 max-h-28 font-light transition-colors"
            @input="autoResize"
            @keydown="handleKeydown"
          />
          <button
            type="submit"
            :disabled="!canSend"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 mb-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :class="canSend
              ? 'bg-brandp-500 text-white shadow-md shadow-brandp-500/20 hover:bg-brandp-600 hover:shadow-lg'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'"
          >
            Generate
            <UIcon name="i-lucide-arrow-up" class="w-4 h-4" />
          </button>
        </form>

        <!-- Suggestion chips — show below input when meal plan exists -->
        <Transition name="chips-fade">
          <div v-if="hasMealPlans && !sending" class="flex flex-wrap gap-2 mt-4">
            <button
              v-for="chip in modifyChips"
              :key="chip"
              class="px-3.5 py-1.5 rounded-full text-xs font-light border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800/40 hover:border-brandp-300 dark:hover:border-brandp-700 hover:text-brandp-600 dark:hover:text-brandp-400 transition-all"
              @click="handleQuickAsk(chip)"
            >
              {{ chip }}
            </button>
          </div>
        </Transition>
      </div>

      <!-- Welcome state: suggested questions (no meal plan yet, not loading) -->
      <Transition name="section-fade">
        <div v-if="!hasMealPlans && !sending" class="mb-16">
          <div class="text-center mb-10">
            <h2 class="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white mb-3">
              What shall we <span class="font-serif italic text-brandp-500 text-3xl sm:text-4xl">cook</span> today?
            </h2>
            <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-light">
              Pick a suggestion or type your own request above.
            </p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <button
              v-for="(q, idx) in suggestedQuestions"
              :key="q.text"
              class="group p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 text-left hover:border-brandp-200 dark:hover:border-brandp-800 hover:bg-brandp-50/50 dark:hover:bg-brandp-900/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brandp-500/5 transition-all duration-200 suggestion-card"
              :style="{ animationDelay: `${idx * 0.08}s` }"
              @click="handleQuickAsk(q.text)"
            >
              <UIcon :name="q.icon" class="w-5 h-5 mb-3 text-brandp-500" />
              <p class="text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{{ q.text }}</p>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Generating state — cooking animation, centered in remaining viewport -->
      <Transition name="section-fade">
        <div v-if="sending" class="flex items-center justify-center" style="min-height: calc(100vh - 200px)">
          <FoodchatCookingAnimation />
        </div>
      </Transition>

      <!-- Meal Plan Display -->
      <Transition name="plan-reveal">
        <div v-if="hasMealPlans && !sending" class="mb-16">
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white">
              Your <span class="font-serif italic text-brandp-500 text-3xl sm:text-4xl">meal plan</span>
            </h2>
            <button
              class="text-xs text-gray-400 hover:text-brandp-500 dark:hover:text-brandp-400 font-light transition-colors"
              @click="handleStartOver"
            >
              <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5 inline mr-1" />
              Start fresh
            </button>
          </div>

          <div v-if="latestMealPlan">
            <div
              :key="latestMealPlan.id"
              class="rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden plan-card"
            >
              <!-- Plan header -->
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-700/50 bg-gradient-to-r from-brandp-50/60 to-earth-1/40 dark:from-brandp-950/20 dark:to-zinc-800/20">
                <div class="flex items-center gap-2.5">
                  <UIcon name="i-lucide-calendar-days" class="w-5 h-5 text-brandp-500" />
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Daily Plan</span>
                </div>
                <span class="text-xs text-gray-400 font-light">{{ formatPlanDate(latestMealPlan.created_at) }}</span>
              </div>

              <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-700/50">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Apply this plan to members</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Choose members and date</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
                      <UButton
                        color="neutral"
                        variant="outline"
                        size="sm"
                        icon="i-lucide-calendar"
                      >
                        {{ selectedApplyDate }}
                      </UButton>
                      <template #content>
                        <div class="p-2">
                          <UCalendar
                            v-model="selectedApplyDateValue"
                            :min-value="minApplyDateValue"
                            :year-controls="true"
                          />
                        </div>
                      </template>
                    </UPopover>
                    <UPopover :content="{ align: 'end', side: 'bottom', sideOffset: 8 }">
                      <UButton
                        color="neutral"
                        variant="outline"
                        size="sm"
                        icon="i-lucide-users"
                        trailing-icon="i-lucide-chevron-down"
                      >
                        {{ selectedMembersLabel }}
                      </UButton>
                      <template #content>
                        <div class="w-72 p-3">
                          <div class="flex items-center justify-between mb-2">
                            <p class="text-xs font-medium text-gray-900 dark:text-white">Select members</p>
                            <div class="flex items-center gap-1.5">
                              <UButton variant="ghost" size="xs" color="neutral" @click="selectOnlyCurrentMember">
                                Only me
                              </UButton>
                              <UButton variant="ghost" size="xs" color="neutral" @click="selectAllMembers">
                                All
                              </UButton>
                            </div>
                          </div>

                          <div v-if="householdMembers.length === 0" class="text-xs text-gray-500 dark:text-gray-400 py-2">
                            No household members found.
                          </div>

                          <div v-else class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            <div
                              v-for="member in householdMembers"
                              :key="member.id"
                              class="flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors"
                              :class="isCurrentMember(member.id)
                                ? 'bg-brandp-50/70 dark:bg-brandp-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-zinc-700/40 cursor-pointer'"
                              @click="toggleApplyMember(member.id, !isApplyMemberSelected(member.id))"
                            >
                              <UCheckbox
                                :model-value="isApplyMemberSelected(member.id)"
                                :disabled="isCurrentMember(member.id)"
                                @click.stop
                                @update:model-value="(checked) => toggleApplyMember(member.id, checked)"
                              />

                              <ProfileAvatar
                                v-if="getMemberAvatar(member)"
                                :avatar="getMemberAvatar(member)!"
                                size="sm"
                                class="w-8 h-8 shrink-0"
                              />
                              <div
                                v-else
                                class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-semibold flex items-center justify-center shrink-0"
                              >
                                {{ memberInitials(member.name) }}
                              </div>

                              <div class="min-w-0 flex-1">
                                <p class="text-sm text-gray-900 dark:text-white truncate">{{ member.name }}</p>
                              </div>

                              <UBadge v-if="isCurrentMember(member.id)" color="primary" variant="subtle" size="xs">
                                Main
                              </UBadge>
                            </div>
                          </div>
                        </div>
                      </template>
                    </UPopover>

                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-lucide-check"
                      :loading="applyingMealPlan"
                      :disabled="!canApplyMealPlan"
                      @click="applyMealPlanToMembers"
                    >
                      Apply
                    </UButton>
                    <UButton
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-undo-2"
                      :loading="revokingMealPlan"
                      :disabled="!canRevokeMealPlan"
                      @click="revokeMealPlanFromMembers"
                    >
                      Revoke
                    </UButton>
                    <div
                      v-if="applySuccess"
                      class="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
                      <span>{{ applySuccess }}</span>
                    </div>
                  </div>
                </div>

                <UAlert
                  v-if="applyError"
                  class="mt-3"
                  color="red"
                  variant="soft"
                  icon="i-lucide-alert-circle"
                  :title="applyError"
                />
              </div>

              <!-- Meals grid -->
              <div
                class="grid gap-px bg-gray-100 dark:bg-zinc-700/30"
                :class="mealGridCols(latestMealPlan)"
              >
                <FoodchatMealScheduleCard
                  v-if="latestMealPlan.breakfast"
                  type="Breakfast"
                  time="08:00"
                  icon="i-lucide-coffee"
                  :recipe="latestMealPlan.breakfast"
                />
                <FoodchatMealScheduleCard
                  v-if="latestMealPlan.lunch"
                  type="Lunch"
                  time="13:00"
                  icon="i-lucide-utensils"
                  :recipe="latestMealPlan.lunch"
                />
                <FoodchatMealScheduleCard
                  v-if="latestMealPlan.dinner"
                  type="Dinner"
                  time="19:30"
                  icon="i-lucide-moon"
                  :recipe="latestMealPlan.dinner"
                />
              </div>

              <!-- Reasoning + vote -->
              <div class="flex items-start gap-4 px-6 py-4 border-t border-gray-100 dark:border-zinc-700/50">
                <div v-if="latestMealPlan.reasoning" class="flex items-start gap-2.5 flex-1 min-w-0">
                  <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-brandp-400 mt-0.5 shrink-0" />
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ latestMealPlan.reasoning }}</p>
                </div>
                <div v-else class="flex-1" />

                <div class="flex items-center gap-1 shrink-0">
                  <UTooltip text="This plan works well">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      icon="i-lucide-thumbs-up"
                      :class="planVotes[latestMealPlan.id] === 'up' ? 'text-brandp-500' : ''"
                      @click="votePlan(latestMealPlan.id, 'up')"
                    />
                  </UTooltip>
                  <UTooltip text="Needs improvement">
                    <UButton
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      icon="i-lucide-thumbs-down"
                      :class="planVotes[latestMealPlan.id] === 'down' ? 'text-brand-500' : ''"
                      @click="votePlan(latestMealPlan.id, 'down')"
                    />
                  </UTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Disclaimer -->
      <div class="text-center mt-8">
        <p class="text-[10px] text-gray-400 dark:text-gray-500 font-light">
          Responses are informational. Consult a nutritionist for medical advice.
        </p>
      </div>

      <!-- Error toast -->
      <Transition name="toast-slide">
        <div
          v-if="error"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50"
        >
          <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300 shadow-lg shadow-red-500/5">
            <UIcon name="i-lucide-alert-circle" class="w-4 h-4 shrink-0" />
            <span class="flex-1 font-light">{{ error }}</span>
            <button class="shrink-0 text-red-400 hover:text-red-600 transition-colors" @click="clearError">
              <UIcon name="i-lucide-x" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </Transition>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, watch } from 'vue'
import { useFoodChat } from '~/composables/useFoodChat'
import { useHouseholdStore } from '~/stores/household'
import type { MealPlan, MealRecipe } from '~/services/foodchatApi'
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import memberMealPlansApi, {
  extractSourceMealPlanIdFromMemberMealPlanResponse,
  extractStoredMealPlanIdFromMemberMealPlanResponse
} from '~/services/memberMealPlansApi'
import type { HouseholdMember } from '~/services/householdsApi'
import { stringToAvatarConfig, type AvatarConfig } from '~/utils/avatarPresets'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'profile']
})

useHead({ title: 'FoodChat' })

const {
  activeSession,
  mealPlans,
  hasMealPlans,
  sending,
  error,
  loadSessions,
  newSession,
  sendMessage,
  clearError
} = useFoodChat()

const householdStore = useHouseholdStore()

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const planVotes = reactive<Record<string, 'up' | 'down' | null>>({})
const selectedApplyMemberIds = ref<string[]>([])
const applyingMealPlan = ref(false)
const revokingMealPlan = ref(false)
const applyError = ref<string | null>(null)
const applySuccess = ref<string | null>(null)
const selectedApplyDateValue = ref<DateValue>(today(getLocalTimeZone()))
const storedMealPlanIdsBySourceId = ref<Record<string, string>>({})
const revocablePlanIdByMemberId = ref<Record<string, string>>({})
const minApplyDateValue = computed(() => today(getLocalTimeZone()))
const selectedApplyDate = computed(() => selectedApplyDateValue.value.toString())
const checkingRevokeEligibility = ref(false)
let revokeEligibilityRequestId = 0

const canSend = computed(() => inputText.value.trim().length > 0 && !sending.value)
const latestMealPlan = computed(() => mealPlans.value?.[0] ?? null)
const householdMembers = computed(() => householdStore.householdMembers)
const currentMemberId = computed(() => householdStore.currentMember?.id ?? null)
const selectedMembersLabel = computed(() => {
  const count = selectedApplyMemberIds.value.length
  if (count === 0) return 'Select members'
  if (count === 1) return '1 member selected'
  return `${count} members selected`
})
const canApplyMealPlan = computed(() => {
  return !!latestMealPlan.value
    && !!currentMemberId.value
    && !!selectedApplyDateValue.value
    && selectedApplyMemberIds.value.length > 0
    && !applyingMealPlan.value
    && !revokingMealPlan.value
})
const canRevokeMealPlan = computed(() => {
  if (!latestMealPlan.value || !currentMemberId.value || revokingMealPlan.value || applyingMealPlan.value || checkingRevokeEligibility.value) {
    return false
  }

  const selectedIds = selectedApplyMemberIds.value
  if (!selectedIds.length) return false

  return selectedIds.every(memberId => !!revocablePlanIdByMemberId.value[memberId])
})

const suggestedQuestions = [
  { text: 'Create a balanced meal plan for today', icon: 'i-lucide-calendar-days' },
  { text: 'High-protein vegetarian ideas', icon: 'i-lucide-leaf' },
  { text: 'Mediterranean diet for today', icon: 'i-lucide-heart-pulse' },
  { text: 'Low-sugar dessert alternatives', icon: 'i-lucide-cherry' }
]

const modifyChips = [
  'Make it lower calorie',
  'Add more protein',
  'Swap lunch for something lighter',
  'Make it vegetarian',
  'Suggest a different dinner'
]

watch(
  [currentMemberId, householdMembers],
  () => {
    const validMemberIds = new Set(householdMembers.value.map(member => member.id))
    const next = selectedApplyMemberIds.value.filter(memberId => validMemberIds.has(memberId))

    if (currentMemberId.value && !next.includes(currentMemberId.value)) {
      next.unshift(currentMemberId.value)
    }

    selectedApplyMemberIds.value = next
  },
  { immediate: true }
)

watch(
  () => latestMealPlan.value?.id,
  () => {
    applyError.value = null
    applySuccess.value = null
  }
)

watch(
  [() => latestMealPlan.value?.id, selectedApplyDate, () => selectedApplyMemberIds.value.slice().join(',')],
  () => {
    void refreshRevokeEligibility()
  },
  { immediate: true }
)

function mealGridCols(plan: MealPlan): string {
  const count = [plan.breakfast, plan.lunch, plan.dinner].filter(Boolean).length
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  return 'grid-cols-1 sm:grid-cols-3'
}

function votePlan(planId: string, vote: 'up' | 'down') {
  planVotes[planId] = planVotes[planId] === vote ? null : vote
}

function isCurrentMember(memberId: string): boolean {
  return currentMemberId.value === memberId
}

function isApplyMemberSelected(memberId: string): boolean {
  return selectedApplyMemberIds.value.includes(memberId)
}

function toggleApplyMember(memberId: string, checked: boolean | 'indeterminate') {
  if (isCurrentMember(memberId) || checked === 'indeterminate') return

  if (checked) {
    if (!selectedApplyMemberIds.value.includes(memberId)) {
      selectedApplyMemberIds.value.push(memberId)
    }
    return
  }

  selectedApplyMemberIds.value = selectedApplyMemberIds.value.filter(id => id !== memberId)
}

function selectOnlyCurrentMember() {
  if (!currentMemberId.value) {
    selectedApplyMemberIds.value = []
    return
  }

  selectedApplyMemberIds.value = [currentMemberId.value]
}

function selectAllMembers() {
  const allIds = householdMembers.value.map(member => member.id)
  if (currentMemberId.value && !allIds.includes(currentMemberId.value)) {
    allIds.unshift(currentMemberId.value)
  }
  selectedApplyMemberIds.value = allIds
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getMemberAvatar(member: HouseholdMember): AvatarConfig | null {
  if (!member.image_url) return null
  return stringToAvatarConfig(member.image_url)
}

function cloneRecipe(recipe?: MealRecipe): MealRecipe | undefined {
  if (!recipe) return undefined
  return {
    recipe_id: recipe.recipe_id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    directions: recipe.directions
  }
}

function buildMealPlanPayload(mealPlan: MealPlan): MealPlan {
  return {
    id: mealPlan.id,
    created_at: mealPlan.created_at,
    breakfast: cloneRecipe(mealPlan.breakfast),
    lunch: cloneRecipe(mealPlan.lunch),
    dinner: cloneRecipe(mealPlan.dinner),
    reasoning: mealPlan.reasoning
  }
}

async function refreshRevokeEligibility() {
  const planId = latestMealPlan.value?.id
  const selectedIds = [...selectedApplyMemberIds.value]

  if (!planId || !selectedIds.length) {
    revocablePlanIdByMemberId.value = {}
    checkingRevokeEligibility.value = false
    return
  }

  checkingRevokeEligibility.value = true
  const requestId = ++revokeEligibilityRequestId

  try {
    const cachedStoredPlanId = storedMealPlanIdsBySourceId.value[planId]
    const nextRevocableMap: Record<string, string> = {}

    await Promise.all(
      selectedIds.map(async (memberId) => {
        try {
          const response = await memberMealPlansApi.getMealPlan(memberId, selectedApplyDate.value)
          const storedPlanId = extractStoredMealPlanIdFromMemberMealPlanResponse(response)
          const sourcePlanId = extractSourceMealPlanIdFromMemberMealPlanResponse(response)

          if (!storedPlanId) return

          const matchesSourcePlan = sourcePlanId === planId
          const matchesStoredPlan = !!cachedStoredPlanId && storedPlanId === cachedStoredPlanId

          if (matchesSourcePlan || matchesStoredPlan) {
            nextRevocableMap[memberId] = storedPlanId
          }
        } catch {
          // If member has no plan for this date, simply leave them non-revocable.
        }
      })
    )

    if (requestId !== revokeEligibilityRequestId) return

    const firstStoredId = Object.values(nextRevocableMap)[0]
    if (firstStoredId && !storedMealPlanIdsBySourceId.value[planId]) {
      storedMealPlanIdsBySourceId.value[planId] = firstStoredId
    }

    revocablePlanIdByMemberId.value = nextRevocableMap
  } finally {
    if (requestId === revokeEligibilityRequestId) {
      checkingRevokeEligibility.value = false
    }
  }
}

onMounted(async () => {
  await loadSessions()

  if (!householdMembers.value.length && householdStore.currentHousehold?.id) {
    await householdStore.fetchMembers()
  }
})

async function applyMealPlanToMembers() {
  if (!latestMealPlan.value || !currentMemberId.value) return

  applyingMealPlan.value = true
  applyError.value = null
  applySuccess.value = null

  try {
    const mealPlanPayload = buildMealPlanPayload(latestMealPlan.value)
    const selectedMemberIds = new Set(selectedApplyMemberIds.value)
    selectedMemberIds.add(currentMemberId.value)

    const response = await memberMealPlansApi.storeMealPlan(currentMemberId.value, {
      date: selectedApplyDate.value,
      applies_to_member_ids: Array.from(selectedMemberIds),
      meal_plan: mealPlanPayload,
      foodchat_response: {
        help: 'Meal plan stored from FoodChat UI',
        success: true,
        result: [mealPlanPayload]
      }
    })

    const storedMealPlanId = extractStoredMealPlanIdFromMemberMealPlanResponse(response)
    if (storedMealPlanId) {
      storedMealPlanIdsBySourceId.value[latestMealPlan.value.id] = storedMealPlanId
    }

    applySuccess.value = `Applied • ${selectedApplyDate.value}`
    await refreshRevokeEligibility()
  } catch (err: unknown) {
    const message = (err && typeof err === 'object' && 'message' in err)
      ? String((err as { message: string }).message)
      : 'Failed to apply meal plan.'
    applyError.value = message
  } finally {
    applyingMealPlan.value = false
  }
}

async function revokeMealPlanFromMembers() {
  if (!latestMealPlan.value || !currentMemberId.value) return

  revokingMealPlan.value = true
  applyError.value = null
  applySuccess.value = null

  try {
    const selectedIds = [...selectedApplyMemberIds.value]
    const ineligibleMembers = selectedIds.filter(memberId => !revocablePlanIdByMemberId.value[memberId])

    if (ineligibleMembers.length > 0) {
      throw new Error('Some selected members do not have this meal plan for the chosen date.')
    }

    for (const memberId of selectedIds) {
      const storedPlanId = revocablePlanIdByMemberId.value[memberId]
      await memberMealPlansApi.revokeMealPlan(memberId, storedPlanId, false)
    }

    await refreshRevokeEligibility()

    applySuccess.value = 'Revoked'
  } catch (err: unknown) {
    const message = (err && typeof err === 'object' && 'message' in err)
      ? String((err as { message: string }).message)
      : 'Failed to revoke meal plan.'
    applyError.value = message
  } finally {
    revokingMealPlan.value = false
  }
}

async function ensureSessionAndSend(content: string) {
  if (!activeSession.value) {
    await newSession()
  }
  await sendMessage(content)
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  nextTick(() => {
    if (inputRef.value) inputRef.value.style.height = 'auto'
  })
  await ensureSessionAndSend(text)
}

async function handleQuickAsk(question: string) {
  await ensureSessionAndSend(question)
}

async function handleStartOver() {
  applyError.value = null
  applySuccess.value = null
  await newSession()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function autoResize(e: Event) {
  const textarea = e.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px'
}

function formatPlanDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

.font-serif {
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* ── Section transitions ── */
.section-fade-enter-active {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.section-fade-leave-active {
  transition: opacity 0.3s ease-in, transform 0.3s ease-in;
}
.section-fade-enter-from {
  opacity: 0;
  transform: translateY(24px);
}
.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ── Meal plan reveal ── */
.plan-reveal-enter-active {
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}
.plan-reveal-leave-active {
  transition: opacity 0.3s ease-in;
}
.plan-reveal-enter-from {
  opacity: 0;
  transform: translateY(40px);
}
.plan-reveal-leave-to {
  opacity: 0;
}

/* ── Individual plan card stagger ── */
.plan-card {
  animation: card-appear 0.6s ease-out both;
}
@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Suggestion cards stagger ── */
.suggestion-card {
  animation: suggestion-pop 0.5s ease-out both;
}
@keyframes suggestion-pop {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── Chips fade ── */
.chips-fade-enter-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.chips-fade-leave-active {
  transition: opacity 0.2s ease-in;
}
.chips-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.chips-fade-leave-to {
  opacity: 0;
}

/* ── Toast slide ── */
.toast-slide-enter-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}
.toast-slide-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, 16px);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}
</style>
