<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
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
            <span class="font-serif italic text-brand-500 text-4xl sm:text-5xl">FoodScholar</span>
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-300 font-light">
            Educational content and nutritional insights about sustainable eating
          </p>
        </div>
      </div>
    </div>



    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-12">
      <section class="mb-12 scroll-fade-in" style="--delay: 0.4s">
        <div class="bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Ask FoodScholar AI</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Get instant answers about nutrition and food science</p>
            </div>
          </div>

          <!-- Current Response Display -->
          <div v-if="currentResponse" class="mb-4 p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-bot" class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <p class="text-gray-900 dark:text-white font-light leading-relaxed">{{ currentResponse }}</p>
            </div>
          </div>

          <!-- Chat Input -->
          <div class="relative">
            <input
              v-model="chatQuery"
              @keyup.enter="askScholarAI"
              type="text"
              placeholder="Ask about nutrition, ingredients, or food science..."
              class="w-full pl-10 pr-14 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
         
          </div>

          <!-- Quick Questions -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="quickQ in quickQuestions"
              :key="quickQ"
              @click="askQuickQuestion(quickQ)"
              class="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              {{ quickQ }}
            </button>
          </div>
        </div>
      </section>
      <!-- Search Bar -->
    

      

      <!-- Category Filter -->
      <section class="mb-12 scroll-fade-in" style="--delay: 0.1s">
        <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter by Category</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-6 py-2 rounded-full font-medium transition-all duration-300',
              selectedCategory === category
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
            ]"
          >
            {{ category }}
          </button>
        </div>
      </section>

        <section class="mb-12 scroll-fade-in">
        <div class="relative">
          <UIcon name="i-lucide-search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by topic, keyword, or tag..."
            class="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </section>

      <!-- Articles Grid -->
      <section class="mb-16">
        <h2 class="text-3xl font-serif font-semibold mb-8 text-gray-900 dark:text-white">Scientific Articles</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NuxtLink
            v-for="(article, index) in filteredArticles"
            :key="article.id"
            :to="`/foodscholar/${article.id}`"
            class="scroll-fade-in group p-6 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            :style="{ '--delay': `${index * 0.1}s` }"
          >
            <div class="flex items-start justify-between mb-3">
              <span class="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {{ article.category }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ article.readTime }} min read</span>
            </div>

            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {{ article.title }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-4">
              {{ article.excerpt }}
            </p>

            <!-- Reactions and Citations -->
            <div class="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-thumbs-up" class="w-3.5 h-3.5" />
                <span>{{ article.reactions?.helpful || 0 }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5" />
                <span>{{ article.reactions?.insightful || 0 }}</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
                <span>{{ article.reactions?.interesting || 0 }}</span>
              </div>
              <div class="flex items-center gap-1 ml-auto">
                <UIcon name="i-lucide-quote" class="w-3.5 h-3.5" />
                <span>{{ article.citations || 0 }} citations</span>
              </div>
            </div>

            <div class="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium text-sm">
              Read Article
              <UIcon name="i-lucide-arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Popular Topics Section -->
      <section class="scroll-fade-in bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 border border-brand-200 dark:border-brand-800 rounded-3xl p-8 sm:p-12 mb-12" style="--delay: 0.3s">
        <h2 class="text-3xl font-serif font-semibold mb-8 text-gray-900 dark:text-white">Popular Topics</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="topic in topics"
            :key="topic.title"
            class="p-6 rounded-2xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 cursor-pointer hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div class="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center mb-4">
              <UIcon :name="topic.icon" class="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{{ topic.title }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-light">{{ topic.description }}</p>
          </div>
        </div>
      </section>

      <!-- AI Scholar Assistant Chat -->
      
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({
  title: 'FoodScholar - WiseFood',
  description: 'Educational content and nutritional insights about sustainable eating'
})

interface Article {
  id: number
  title: string
  category: string
  excerpt: string
  readTime: number
  reactions?: {
    helpful: number
    insightful: number
    interesting: number
  }
  citations?: number
}

const articles: Article[] = [
  {
    id: 1,
    title: "Understanding Plant-Based Proteins",
    category: "Nutrition",
    excerpt: "Explore the complete amino acid profiles of legumes, grains, and plant-based sources.",
    readTime: 5,
    reactions: { helpful: 124, insightful: 89, interesting: 156 },
    citations: 23,
  },
  {
    id: 2,
    title: "The Carbon Footprint of Your Diet",
    category: "Sustainability",
    excerpt: "Learn how different foods impact the environment and discover lower-impact alternatives.",
    readTime: 7,
    reactions: { helpful: 201, insightful: 167, interesting: 243 },
    citations: 42,
  },
  {
    id: 3,
    title: "Micronutrients You Might Be Missing",
    category: "Health",
    excerpt: "A science-based guide to identifying and addressing common micronutrient deficiencies.",
    readTime: 6,
    reactions: { helpful: 178, insightful: 142, interesting: 91 },
    citations: 31,
  },
  {
    id: 4,
    title: "Seasonal Eating for Optimal Nutrition",
    category: "Wellness",
    excerpt: "Discover why eating seasonally benefits both your health and the planet.",
    readTime: 4,
    reactions: { helpful: 95, insightful: 73, interesting: 112 },
    citations: 18,
  },
  {
    id: 5,
    title: "Fermented Foods and Gut Health",
    category: "Health",
    excerpt: "Understanding the science behind probiotics and their role in digestive wellness.",
    readTime: 8,
    reactions: { helpful: 215, insightful: 189, interesting: 267 },
    citations: 56,
  },
  {
    id: 6,
    title: "Water Footprint of Different Foods",
    category: "Sustainability",
    excerpt: "How much water does it take to produce your favorite foods? A comprehensive analysis.",
    readTime: 5,
    reactions: { helpful: 167, insightful: 134, interesting: 198 },
    citations: 38,
  },
]

const categories = ["All", "Nutrition", "Sustainability", "Health", "Wellness"]

const topics = [
  {
    title: "Nutrition Science",
    description: "Explore curated content on nutrition science",
    icon: "i-lucide-flask-conical"
  },
  {
    title: "Sustainable Choices",
    description: "Explore curated content on sustainable choices",
    icon: "i-lucide-leaf"
  },
  {
    title: "Wellness Tips",
    description: "Explore curated content on wellness tips",
    icon: "i-lucide-heart"
  }
]

const selectedCategory = ref("All")
const searchQuery = ref("")
const chatQuery = ref("")
const currentResponse = ref("")
const isThinking = ref(false)

const quickQuestions = [
  "What are complete proteins?",
  "Benefits of fermented foods?",
  "How to reduce food waste?",
  "Best sources of omega-3?"
]

const filteredArticles = computed(() => {
  let filtered = articles

  // Filter by category
  if (selectedCategory.value !== "All") {
    filtered = filtered.filter(article => article.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    )
  }

  return filtered
})

const mockResponses: Record<string, string> = {
  "complete proteins": "Complete proteins contain all nine essential amino acids in sufficient amounts. Animal sources like meat, fish, and eggs are complete proteins. Plant sources like quinoa, buckwheat, and soy are also complete. You can combine incomplete plant proteins (like rice and beans) to form complete protein profiles.",
  "fermented foods": "Fermented foods like yogurt, kimchi, sauerkraut, and kombucha contain beneficial probiotics that support gut health. These live bacteria can improve digestion, boost immunity, and may even influence mental health through the gut-brain axis. Different fermented foods provide different bacterial strains with unique benefits.",
  "food waste": "To reduce food waste: plan meals ahead, store produce properly, use leftovers creatively, understand expiration dates, freeze excess food, compost scraps, and buy only what you need. Food waste contributes significantly to greenhouse gas emissions, so reducing it benefits both your wallet and the environment.",
  "omega-3": "The best sources of omega-3 fatty acids include fatty fish (salmon, mackerel, sardines), flaxseeds, chia seeds, walnuts, and algae-based supplements. Omega-3s are essential for brain health, reducing inflammation, and supporting heart health. Aim for at least two servings of fatty fish per week or plant-based alternatives."
}

const askScholarAI = () => {
  if (!chatQuery.value.trim() || isThinking.value) return

  const question = chatQuery.value.toLowerCase()
  isThinking.value = true

  // Simulate AI thinking
  setTimeout(() => {
    // Find matching response
    let response = "I'm here to help with questions about nutrition, food science, and sustainable eating. Feel free to ask me anything about the topics covered in our articles, or try one of the quick questions below!"

    for (const [key, value] of Object.entries(mockResponses)) {
      if (question.includes(key)) {
        response = value
        break
      }
    }

    currentResponse.value = response
    chatQuery.value = ""
    isThinking.value = false
  }, 1000)
}

const askQuickQuestion = (question: string) => {
  chatQuery.value = question
  askScholarAI()
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
