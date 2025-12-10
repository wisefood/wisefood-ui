<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/dashboard"
              class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
              <span class="text-sm font-medium">Back to Dashboard</span>
            </NuxtLink>
          </div>
        </div>
        <div class="mt-4">
          <h1 class="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
            <span class="font-serif italic text-purple-600 dark:text-purple-400 text-4xl sm:text-5xl">FoodChat</span>
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-300 font-light">
            Your AI nutrition assistant - Ask anything about food, health, and wellness
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 py-12">
      <!-- Chat Container -->
      <div class="mb-6 scroll-fade-in">
        <div class="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 min-h-[500px] flex flex-col">
          <!-- Messages Area -->
          <div class="flex-1 space-y-6 mb-6">
            <!-- Welcome Message -->
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-bot" class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-2xl rounded-tl-none p-4">
                <p class="text-gray-900 dark:text-white font-light leading-relaxed">
                  Hello! I'm your nutrition AI assistant. I can help you with meal planning, nutritional information,
                  dietary advice, recipe suggestions, and answer any questions about food and wellness.
                  What would you like to know?
                </p>
              </div>
            </div>

            <!-- Sample User Message (placeholder) -->
            <div v-if="messages.length > 0" class="flex items-start gap-4 justify-end">
              <div class="flex-1 bg-brand-500 text-white rounded-2xl rounded-tr-none p-4 max-w-md ml-auto">
                <p class="font-light leading-relaxed">
                  {{ messages[0] }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-user" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="relative">
            <input
              v-model="currentMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Ask me anything about nutrition, recipes, or wellness..."
              class="w-full pl-6 pr-14 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              @click="sendMessage"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors"
            >
              <UIcon name="i-lucide-send" class="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <!-- Suggested Questions -->
      <section class="scroll-fade-in" style="--delay: 0.1s">
        <h2 class="text-2xl font-serif font-semibold mb-6 text-gray-900 dark:text-white">Suggested Questions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            @click="askQuestion(question)"
            class="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 group"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-message-circle-question" class="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p class="text-gray-900 dark:text-white font-light group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {{ question }}
              </p>
            </div>
          </button>
        </div>
      </section>

      <!-- Features Section -->
      <section class="mt-12 scroll-fade-in bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-3xl p-8 sm:p-12" style="--delay: 0.2s">
        <h2 class="text-3xl font-serif font-semibold mb-8 text-gray-900 dark:text-white">What I Can Help You With</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
              <UIcon :name="feature.icon" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-light">{{ feature.description }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'FoodChat - WiseFood',
  description: 'Your AI nutrition assistant'
})

const currentMessage = ref('')
const messages = ref<string[]>([])

const suggestedQuestions = [
  "What are some high-protein vegetarian meal ideas?",
  "How can I reduce my sugar intake without sacrificing taste?",
  "What's the nutritional difference between quinoa and rice?",
  "Can you suggest a meal plan for weight management?",
  "What foods are good for gut health?",
  "How do I calculate my daily calorie needs?",
]

const features = [
  {
    title: "Meal Planning",
    description: "Get personalized meal plans based on your goals and preferences",
    icon: "i-lucide-calendar-days"
  },
  {
    title: "Nutrition Facts",
    description: "Learn about nutritional content, vitamins, and minerals in foods",
    icon: "i-lucide-info"
  },
  {
    title: "Recipe Suggestions",
    description: "Discover recipes tailored to your dietary needs and restrictions",
    icon: "i-lucide-chef-hat"
  },
  {
    title: "Health Guidance",
    description: "Get evidence-based advice on diet and wellness topics",
    icon: "i-lucide-heart-pulse"
  },
  {
    title: "Substitutions",
    description: "Find healthy alternatives for ingredients in your recipes",
    icon: "i-lucide-repeat"
  },
  {
    title: "Dietary Support",
    description: "Support for various diets: vegan, keto, Mediterranean, and more",
    icon: "i-lucide-apple"
  },
]

const sendMessage = () => {
  if (currentMessage.value.trim()) {
    messages.value.unshift(currentMessage.value)
    currentMessage.value = ''
  }
}

const askQuestion = (question: string) => {
  currentMessage.value = question
  sendMessage()
}

let observer: IntersectionObserver | null = null

onMounted(() => {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer?.unobserve(entry.target)
      }
    })
  }, observerOptions)

  document.querySelectorAll('.scroll-fade-in').forEach((el) => {
    observer?.observe(el)
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
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
