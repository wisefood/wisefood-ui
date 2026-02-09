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

      <!-- Input bar — borderless, clean -->
      <div class="mb-12 scroll-fade-in" style="--delay: 0.1s">
        <form class="flex items-end gap-4" @submit.prevent="handleSend">
          <textarea
            ref="inputRef"
            v-model="inputText"
            rows="1"
            :disabled="sending"
            :placeholder="hasMealPlans ? 'Modify your meal plan — e.g. swap lunch for something lighter...' : 'Describe your ideal meals — e.g. high-protein, Mediterranean style...'"
            class="flex-1 resize-none bg-transparent border-b-2 border-zinc-200 dark:border-zinc-700 px-2 py-3.5 text-base text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brandp-500 dark:focus:border-brandp-400 disabled:opacity-40 max-h-28 font-light transition-colors"
            @input="autoResize"
            @keydown="handleKeydown"
          />
          <UButton
            type="submit"
            :disabled="!canSend"
            color="primary"
            size="sm"
            trailing-icon="i-lucide-arrow-up"
            class="cursor-pointer shrink-0 mb-1.5"
          >
            Generate
          </UButton>
        </form>
      </div>

      <!-- Welcome state: suggested questions (no meal plan yet, not loading) -->
      <div v-if="!hasMealPlans && !sending" class="mb-16 scroll-fade-in" style="--delay: 0.15s">
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
            v-for="q in suggestedQuestions"
            :key="q.text"
            class="group p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 text-left hover:border-brandp-200 dark:hover:border-brandp-800 hover:bg-brandp-50/50 dark:hover:bg-brandp-900/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brandp-500/5 transition-all duration-200"
            @click="handleQuickAsk(q.text)"
          >
            <UIcon :name="q.icon" class="w-5 h-5 mb-3 text-brandp-500" />
            <p class="text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">{{ q.text }}</p>
          </button>
        </div>
      </div>

      <!-- Generating state -->
      <div v-if="sending" class="mb-16 scroll-fade-in" style="--delay: 0.15s">
        <div class="rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl p-12 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brandp-100 to-brandp-200 dark:from-brandp-900/40 dark:to-brandp-800/40 mb-5">
            <UIcon name="i-lucide-chef-hat" class="w-8 h-8 text-brandp-500 animate-pulse" />
          </div>
          <h3 class="text-xl font-light text-gray-900 dark:text-white mb-2">
            Preparing your <span class="font-serif italic text-brandp-500 text-2xl">meal plan</span>
          </h3>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-light">
            This may take a moment...
          </p>
          <div class="flex items-center justify-center gap-2 mt-6">
            <span class="w-2 h-2 bg-brandp-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span class="w-2 h-2 bg-brandp-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span class="w-2 h-2 bg-brandp-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>

      <!-- Meal Plan Display -->
      <div v-if="hasMealPlans && !sending" class="mb-16 scroll-fade-in" style="--delay: 0.2s">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white">
            Your meal <span class="font-serif italic text-brandp-500 text-3xl sm:text-4xl">plan</span>
          </h2>
          <button
            class="text-xs text-gray-400 hover:text-brandp-500 dark:hover:text-brandp-400 font-light transition-colors"
            @click="handleStartOver"
          >
            <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5 inline mr-1" />
            Start fresh
          </button>
        </div>

        <div class="space-y-8">
          <div
            v-for="plan in mealPlans"
            :key="plan.id"
            class="rounded-3xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden"
          >
            <!-- Plan header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-700/50 bg-gradient-to-r from-brandp-50/60 to-earth-1/40 dark:from-brandp-950/20 dark:to-zinc-800/20">
              <div class="flex items-center gap-2.5">
                <UIcon name="i-lucide-calendar-days" class="w-5 h-5 text-brandp-500" />
                <span class="text-sm font-medium text-gray-900 dark:text-white">Daily Plan</span>
              </div>
              <span class="text-xs text-gray-400 font-light">{{ formatPlanDate(plan.created_at) }}</span>
            </div>

            <!-- Meals grid — dynamic columns based on available meals -->
            <div
              class="grid gap-px bg-gray-100 dark:bg-zinc-700/30"
              :class="mealGridCols(plan)"
            >
              <FoodchatMealScheduleCard
                v-if="plan.breakfast"
                type="Breakfast"
                time="08:00"
                icon="i-lucide-coffee"
                :recipe="plan.breakfast"
              />
              <FoodchatMealScheduleCard
                v-if="plan.lunch"
                type="Lunch"
                time="13:00"
                icon="i-lucide-utensils"
                :recipe="plan.lunch"
              />
              <FoodchatMealScheduleCard
                v-if="plan.dinner"
                type="Dinner"
                time="19:30"
                icon="i-lucide-moon"
                :recipe="plan.dinner"
              />
              <FoodchatMealScheduleCard
                v-if="plan.snack"
                type="Snack"
                time="16:00"
                icon="i-lucide-cookie"
                :recipe="plan.snack"
              />
            </div>

            <!-- Reasoning + vote -->
            <div class="flex items-start gap-4 px-6 py-4 border-t border-gray-100 dark:border-zinc-700/50">
              <div v-if="plan.reasoning" class="flex items-start gap-2.5 flex-1 min-w-0">
                <UIcon name="i-lucide-lightbulb" class="w-4 h-4 text-brandp-400 mt-0.5 shrink-0" />
                <p class="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ plan.reasoning }}</p>
              </div>
              <div v-else class="flex-1" />

              <!-- Upvote / Downvote -->
              <div class="flex items-center gap-1 shrink-0">
                <UTooltip text="This plan works well">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-lucide-thumbs-up"
                    :class="planVotes[plan.id] === 'up' ? 'text-brandp-500' : ''"
                    @click="votePlan(plan.id, 'up')"
                  />
                </UTooltip>
                <UTooltip text="Needs improvement">
                  <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-lucide-thumbs-down"
                    :class="planVotes[plan.id] === 'down' ? 'text-brand-500' : ''"
                    @click="votePlan(plan.id, 'down')"
                  />
                </UTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="text-center scroll-fade-in" style="--delay: 0.3s">
        <p class="text-[10px] text-gray-400 dark:text-gray-500 font-light">
          Responses are informational. Consult a nutritionist for medical advice.
        </p>
      </div>

      <!-- Error toast -->
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

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useFoodChat } from '~/composables/useFoodChat'
import type { MealPlan } from '~/services/foodchatApi'

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

const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const planVotes = reactive<Record<string, 'up' | 'down' | null>>({})

const canSend = computed(() => inputText.value.trim().length > 0 && !sending.value)

const suggestedQuestions = [
  { text: 'Create a balanced weekly meal plan', icon: 'i-lucide-calendar-days' },
  { text: 'High-protein vegetarian ideas', icon: 'i-lucide-leaf' },
  { text: 'Mediterranean diet for today', icon: 'i-lucide-heart-pulse' },
  { text: 'Low-sugar dessert alternatives', icon: 'i-lucide-cherry' }
]

/** Returns the grid-cols class based on how many meals are in the plan */
function mealGridCols(plan: MealPlan): string {
  const count = [plan.breakfast, plan.lunch, plan.dinner, plan.snack].filter(Boolean).length
  if (count <= 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
}

function votePlan(planId: string, vote: 'up' | 'down') {
  planVotes[planId] = planVotes[planId] === vote ? null : vote
}

// Scroll animations
let observer: IntersectionObserver | null = null

onMounted(async () => {
  await loadSessions()

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, { root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.1 })

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })
})

onUnmounted(() => {
  observer?.disconnect()
})

/** Ensure a session exists, then send */
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

.scroll-fade-in {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  transition-delay: var(--delay, 0s);
}

.scroll-fade-in.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
