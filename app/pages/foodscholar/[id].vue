<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <NuxtLink
          to="/foodscholar"
          class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          <span class="text-sm font-medium">Back to Articles</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-12">
      <div v-if="article" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Article Content (Left 2/3) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Article Header -->
          <div class="scroll-fade-in">
            <div class="flex items-center gap-3 mb-4">
              <UBadge color="primary" variant="subtle">{{ article.category }}</UBadge>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ article.readTime }} min read</span>
            </div>

            <h1 class="text-4xl sm:text-5xl font-light text-gray-900 dark:text-white tracking-tight mb-4">
              {{ article.title }}
            </h1>

            <p class="text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-6">
              {{ article.excerpt }}
            </p>

            <!-- Publication Info -->
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-calendar" class="w-4 h-4" />
                <span>{{ new Date(article.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-book-open" class="w-4 h-4" />
                <span>{{ article.journal }}</span>
              </div>
              <div v-if="article.citations" class="flex items-center gap-2">
                <UIcon name="i-lucide-quote" class="w-4 h-4" />
                <span>{{ article.citations }} citations</span>
              </div>
            </div>

            <!-- Authors -->
            <div class="mb-4">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Authors:</p>
              <div class="flex flex-wrap gap-3">
                <div v-for="author in article.authors" :key="author.name" class="text-sm">
                  <span class="text-gray-900 dark:text-white font-medium">{{ author.name }}</span>
                  <span class="text-gray-500 dark:text-gray-400 text-xs block">{{ author.affiliation }}</span>
                </div>
              </div>
            </div>

            <!-- DOI Link -->
            <div v-if="article.doi" class="mb-4">
              <a
                :href="`https://doi.org/${article.doi}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                <span>DOI: {{ article.doi }}</span>
              </a>
            </div>

            <!-- Reactions -->
            <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <button
                v-for="(count, reaction) in article.reactions"
                :key="reaction"
                @click="handleReaction(reaction)"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                  userReactions.includes(reaction)
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-2 border-brand-500'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'
                ]"
              >
                <UIcon
                  :name="reaction === 'helpful' ? 'i-lucide-thumbs-up' : reaction === 'insightful' ? 'i-lucide-lightbulb' : 'i-lucide-star'"
                  class="w-4 h-4"
                />
                <span class="capitalize">{{ reaction }}</span>
                <span class="font-semibold">{{ count }}</span>
              </button>
            </div>
          </div>

          <!-- Key Takeaways -->
          <div class="scroll-fade-in p-6 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" style="--delay: 0.1s">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Key Takeaways
            </h2>
            <ul class="space-y-3">
              <li
                v-for="(takeaway, index) in article.keyTakeaways"
                :key="index"
                class="flex items-start gap-3 text-gray-700 dark:text-gray-300"
              >
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <span class="font-light">{{ takeaway }}</span>
              </li>
            </ul>
          </div>

          <!-- Article Introduction -->
          <div class="scroll-fade-in prose prose-lg dark:prose-invert max-w-none" style="--delay: 0.2s">
            <div class="text-gray-700 dark:text-gray-300 font-light leading-relaxed">
              {{ article.content }}
            </div>
          </div>

          <!-- Article Sections -->
          <div
            v-for="(section, index) in article.sections"
            :key="index"
            class="scroll-fade-in"
            :style="{ '--delay': `${0.3 + index * 0.1}s` }"
          >
            <div class="p-8 rounded-2xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
              <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {{ section.title }}
              </h2>
              <p class="text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                {{ section.content }}
              </p>
            </div>
          </div>

          <!-- Related Articles -->
          <div class="scroll-fade-in pt-8" :style="{ '--delay': `${0.5 + article.sections.length * 0.1}s` }">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Related Articles</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NuxtLink
                v-for="related in relatedArticles"
                :key="related.id"
                :to="`/foodscholar/${related.id}`"
                class="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <UBadge color="primary" variant="subtle" size="xs" class="mb-2">{{ related.category }}</UBadge>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {{ related.title }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ related.excerpt }}</p>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-6">
            <!-- AI Summary Section -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800" style="--delay: 0.1s">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-900 dark:text-white">AI Summary Notes</h3>
                <UButton
                  v-if="summaryNotes"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-copy"
                  @click="copyNotesToClipboard"
                  class="cursor-pointer"
                >
                  {{ copied ? 'Copied!' : '' }}
                </UButton>
              </div>

              <div v-if="!summaryNotes">
                <UButton
                  color="primary"
                  :loading="loadingSummary"
                  @click="generateSummary"
                  class="w-full cursor-pointer"
                >
                  {{ loadingSummary ? 'Generating...' : 'Generate Summary' }}
                </UButton>
              </div>

              <div v-else class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(note, index) in summaryNotesList"
                  :key="index"
                  class="relative bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-3 rounded text-sm text-gray-800 dark:text-gray-200"
                >
                  <p class="leading-snug">{{ note }}</p>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.2s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
              <div class="flex flex-wrap gap-2">
                <NuxtLink
                  v-for="tag in article.tags"
                  :key="tag"
                  :to="`/foodscholar?tag=${encodeURIComponent(tag)}`"
                  class="text-xs bg-brand-100 dark:bg-brand-900/30 hover:bg-brand-200 dark:hover:bg-brand-800/50 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full transition-colors"
                >
                  {{ tag }}
                </NuxtLink>
              </div>
            </div>

            <!-- Share -->
            <div class="scroll-fade-in p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" style="--delay: 0.3s">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Share Article</h3>
              <div class="flex gap-2">
                <UButton variant="outline" size="sm" icon="i-lucide-link" class="flex-1 cursor-pointer">
                  Copy Link
                </UButton>
                <UButton variant="outline" size="sm" icon="i-lucide-bookmark" class="cursor-pointer">
                  Save
                </UButton>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Article Not Found -->
      <div v-else class="flex items-center justify-center py-20">
        <div class="text-center">
          <UIcon name="i-lucide-file-question" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Article Not Found</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
          <UButton to="/foodscholar" color="primary">
            Back to Articles
          </UButton>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: 'auth'
})

interface ArticleSection {
  title: string
  content: string
}

interface Author {
  name: string
  affiliation: string
  orcid?: string
}

interface Article {
  id: string
  title: string
  category: string
  excerpt: string
  readTime: number
  content: string
  sections: ArticleSection[]
  keyTakeaways: string[]
  tags: string[]
  reactions: {
    helpful: number
    insightful: number
    interesting: number
  }
  citations: number
  publishedDate: string
  journal: string
  doi?: string
  authors: Author[]
}

const articles: Article[] = [
  {
    id: "1",
    title: "Understanding Plant-Based Proteins",
    category: "Nutrition",
    excerpt: "Explore the complete amino acid profiles of legumes, grains, and plant-based sources.",
    readTime: 5,
    tags: ["protein", "plant-based", "amino acids", "nutrition"],
    reactions: { helpful: 124, insightful: 89, interesting: 156 },
    citations: 23,
    publishedDate: "2024-09-15",
    journal: "Journal of Nutritional Science",
    doi: "10.1017/jns.2024.0045",
    authors: [
      { name: "Dr. Sarah Martinez", affiliation: "Harvard School of Public Health", orcid: "0000-0002-1234-5678" },
      { name: "Dr. James Chen", affiliation: "Stanford Nutrition Research Center" }
    ],
    keyTakeaways: [
      "Plant proteins contain all 9 essential amino acids when properly combined",
      "Legumes paired with grains create complete protein profiles",
      "Plant-based proteins typically offer higher fiber content than animal sources",
    ],
    content: `Plant-based proteins have become increasingly important in modern nutrition. Whether you're reducing meat consumption or following a vegetarian diet, understanding how to get adequate protein from plants is essential. Plant proteins offer numerous benefits including lower saturated fat content, higher fiber, and often lower environmental impact. The key is understanding which combinations create complete amino acid profiles. Legumes like beans, lentils, and chickpeas are rich in lysine but lower in methionine, while grains like quinoa, rice, and oats are the opposite. When combined, they create a complete protein source. Additionally, modern processing has led to high-quality protein powders and meat alternatives that provide isolated plant proteins with all essential amino acids.`,
    sections: [
      {
        title: "Complete vs Incomplete Proteins",
        content:
          "A complete protein contains all nine essential amino acids that your body cannot produce. Animal proteins are typically complete, while most plant proteins are incomplete. However, by combining different plant sources, you can create complete proteins.",
      },
      {
        title: "Best Plant Protein Sources",
        content:
          "Legumes (beans, lentils, peas), nuts and seeds (almonds, hemp seeds, chia), soy products (tofu, tempeh), and whole grains (quinoa, amaranth) are excellent plant protein sources. Each offers unique micronutrient profiles and health benefits.",
      },
      {
        title: "Meal Planning for Plant Proteins",
        content:
          "Combine legumes with grains within the same day for optimal amino acid absorption. Rice and beans, hummus and pita, or lentil soup with whole grain bread are traditional combinations that work perfectly.",
      },
    ],
  },
  {
    id: "2",
    title: "The Carbon Footprint of Your Diet",
    category: "Sustainability",
    excerpt: "Learn how different foods impact the environment and discover lower-impact alternatives.",
    readTime: 7,
    tags: ["sustainability", "environment", "carbon", "climate"],
    reactions: { helpful: 201, insightful: 167, interesting: 243 },
    citations: 42,
    publishedDate: "2024-08-22",
    journal: "Environmental Nutrition Review",
    doi: "10.1016/j.enr.2024.08.032",
    authors: [
      { name: "Dr. Emily Watson", affiliation: "Oxford Environmental Change Institute", orcid: "0000-0003-4567-8901" },
      { name: "Prof. Michael Green", affiliation: "MIT Sustainability Lab" }
    ],
    keyTakeaways: [
      "Beef production has the highest carbon footprint among common foods",
      "Plant-based foods generally have 50-90% lower emissions than animal products",
      "Local seasonal produce reduces transportation emissions significantly",
    ],
    content: `The environmental impact of our food choices extends far beyond the plate. From production and processing to transportation and storage, every food item carries a carbon footprint. Understanding these impacts empowers you to make more sustainable dietary choices. Beef production is particularly resource-intensive, requiring significant water, feed, and land. Dairy products also have substantial environmental costs. In contrast, plant-based foods like legumes, vegetables, and fruits typically have much lower environmental footprints. This doesn't mean you must become vegan, but reducing consumption of high-impact foods and choosing alternatives can significantly reduce your dietary carbon footprint.`,
    sections: [
      {
        title: "Carbon Footprint by Food Category",
        content:
          "Beef: 27 kg CO2e per kg of food. Lamb: 24 kg CO2e per kg. Cheese: 13.5 kg CO2e per kg. Chicken: 6.9 kg CO2e per kg. Beans: 0.4 kg CO2e per kg. Tofu: 2.0 kg CO2e per kg. These numbers show the dramatic difference between animal and plant proteins.",
      },
      {
        title: "Transportation and Sourcing",
        content:
          "Buying local and seasonal produce can reduce your food's carbon footprint by up to 90% compared to imported items. Frozen produce often has lower impact than fresh imported items due to reduced transportation needs.",
      },
      {
        title: "Practical Reduction Strategies",
        content:
          "Implement Meatless Mondays, replace beef with chicken or plant proteins, buy local when possible, and reduce food waste. Small changes across your diet can significantly lower your overall environmental impact.",
      },
    ],
  },
  {
    id: "3",
    title: "Micronutrients You Might Be Missing",
    category: "Health",
    excerpt: "A science-based guide to identifying and addressing common micronutrient deficiencies.",
    readTime: 6,
    tags: ["micronutrients", "vitamins", "minerals", "health"],
    reactions: { helpful: 178, insightful: 142, interesting: 91 },
    citations: 31,
    publishedDate: "2024-10-05",
    journal: "American Journal of Clinical Nutrition",
    doi: "10.1093/ajcn/nqaa.245",
    authors: [
      { name: "Dr. Rachel Kim", affiliation: "Johns Hopkins Bloomberg School of Public Health" },
      { name: "Dr. Thomas Anderson", affiliation: "Mayo Clinic", orcid: "0000-0001-2345-6789" }
    ],
    keyTakeaways: [
      "Vitamin B12 is critical for vegans and vegetarians and requires supplementation or fortified foods",
      "Iron absorption is enhanced by vitamin C but inhibited by calcium",
      "Iodine deficiency is rare in developed countries due to iodized salt but remains a global health concern",
    ],
    content: `Even with a balanced diet, many people lack certain micronutrients essential for optimal health. Micronutrient deficiencies can lead to fatigue, weakened immunity, poor bone health, and various other conditions. Common deficiencies include vitamin B12, iron, zinc, iodine, and vitamin D. Understanding which foods provide these nutrients and how to optimize absorption is crucial for wellness. Some micronutrients work synergistically—for example, vitamin D enhances calcium absorption—while others compete for absorption pathways.`,
    sections: [
      {
        title: "Critical Micronutrients to Monitor",
        content:
          "Vitamin B12: Essential for nerve function and red blood cells. Found in animal products, fortified plant milks, and supplements. Vitamin D: Supports bone health and immunity. Synthesized by sunlight exposure or obtained from fatty fish, egg yolks, and supplements. Iron: Critical for oxygen transport. Heme iron from meat is better absorbed than non-heme iron from plants, but combining with vitamin C improves plant iron absorption.",
      },
      {
        title: "Absorption Optimization",
        content:
          "Pair iron-rich foods with vitamin C sources like citrus or tomatoes to increase absorption. Take calcium supplements separately from iron supplements. Consume vitamin D with fat-containing meals for optimal absorption. Cook tomatoes with olive oil to enhance lycopene absorption.",
      },
      {
        title: "Testing and Supplementation",
        content:
          "Regular blood work can identify deficiencies before symptoms develop. If following a restricted diet, supplementation of key micronutrients is often recommended. Always consult healthcare providers before starting new supplements.",
      },
    ],
  },
  {
    id: "4",
    title: "Seasonal Eating for Optimal Nutrition",
    category: "Wellness",
    excerpt: "Discover why eating seasonally benefits both your health and the planet.",
    readTime: 4,
    tags: ["seasonal", "nutrition", "wellness", "local"],
    reactions: { helpful: 95, insightful: 73, interesting: 112 },
    citations: 18,
    publishedDate: "2024-11-12",
    journal: "Nutrition & Wellness Today",
    authors: [
      { name: "Dr. Laura Bennett", affiliation: "Cornell University Department of Nutrition" }
    ],
    keyTakeaways: [
      "Seasonal produce has higher nutrient density and better flavor",
      "Seasonal eating reduces food costs and environmental impact",
      "Nature provides what we need when we need it throughout the seasons",
    ],
    content: `Eating seasonally aligns our food consumption with natural agricultural cycles and nutritional needs. Spring brings fresh greens and vegetables rich in chlorophyll and detoxifying properties. Summer provides antioxidant-rich fruits and vegetables. Fall offers hearty squashes and root vegetables for sustained energy. Winter brings stored crops with longevity-promoting properties. Beyond nutrition, seasonal eating connects us to our local food systems and supports farmers.`,
    sections: [
      {
        title: "Spring Nutrition",
        content:
          "Asparagus, leafy greens, peas, and artichokes emerge. These are nutrient-dense, rich in antioxidants, and support natural detoxification after winter months. Their diuretic properties help flush accumulated toxins.",
      },
      {
        title: "Summer's Energy Boost",
        content:
          "Berries, stone fruits, tomatoes, and cucumbers peak. High water content keeps you hydrated. Antioxidants like lycopene and anthocyanins protect against summer sun damage and support cardiovascular health.",
      },
      {
        title: "Fall and Winter Sustenance",
        content:
          "Root vegetables, squashes, and stored crops provide sustained energy and warming properties. Rich in complex carbohydrates and minerals, they support the immune system during cold months.",
      },
    ],
  },
  {
    id: "5",
    title: "Fermented Foods and Gut Health",
    category: "Health",
    excerpt: "Understanding the science behind probiotics and their role in digestive wellness.",
    readTime: 8,
    tags: ["fermentation", "probiotics", "gut-health", "digestion"],
    reactions: { helpful: 215, insightful: 189, interesting: 267 },
    citations: 56,
    publishedDate: "2024-07-18",
    journal: "Gut Microbiome Research",
    doi: "10.1038/s41587-024-01234-5",
    authors: [
      { name: "Dr. Sophie Martinez", affiliation: "UC San Diego School of Medicine", orcid: "0000-0002-9876-5432" },
      { name: "Dr. David Lee", affiliation: "Weizmann Institute of Science" },
      { name: "Dr. Anna Kowalski", affiliation: "Max Planck Institute for Human Development" }
    ],
    keyTakeaways: [
      "Fermented foods contain live beneficial bacteria that support gut microbiome diversity",
      "Probiotics may improve digestion, immunity, and even mental health through the gut-brain axis",
      "Different fermented foods offer different bacterial strains with unique health benefits",
    ],
    content: `Fermentation is one of humanity's oldest food preservation methods and offers remarkable health benefits. During fermentation, beneficial bacteria break down food compounds, creating digestible forms and producing beneficial metabolites. The resulting foods contain live probiotics and prebiotic fibers that nourish beneficial gut bacteria. A healthy gut microbiome influences digestion, immunity, nutrient absorption, mental health, and overall wellness.`,
    sections: [
      {
        title: "How Fermentation Works",
        content:
          "Beneficial bacteria, primarily Lactobacillus species, consume sugars and produce lactic acid. This acidic environment preserves the food while creating digestive benefits. The bacteria also produce B vitamins and other beneficial compounds during the process.",
      },
      {
        title: "Key Fermented Foods",
        content:
          "Sauerkraut and kimchi provide Lactobacillus plantarum. Tempeh offers beneficial bacteria and enzymes. Miso and soy sauce provide diverse bacterial cultures. Kombucha and kefir offer multiple probiotic strains. Yogurt and cultured dairy products are accessible for those who consume dairy.",
      },
      {
        title: "The Gut-Health Connection",
        content:
          "A diverse microbiome correlates with better digestion, immune function, mental clarity, and disease resistance. Regular consumption of fermented foods or quality probiotics supports this diversity. Combined with prebiotic fiber from vegetables and whole grains, fermented foods create an optimal gut environment.",
      },
    ],
  },
  {
    id: "6",
    title: "Water Footprint of Different Foods",
    category: "Sustainability",
    excerpt: "How much water does it take to produce your favorite foods? A comprehensive analysis.",
    readTime: 5,
    tags: ["water", "sustainability", "environmental-impact"],
    reactions: { helpful: 167, insightful: 134, interesting: 198 },
    citations: 38,
    publishedDate: "2024-09-30",
    journal: "Water Resources & Sustainability",
    doi: "10.1002/wat.2024.4567",
    authors: [
      { name: "Dr. Robert Chen", affiliation: "Stockholm International Water Institute" },
      { name: "Dr. Maria Rodriguez", affiliation: "UNESCO-IHE Institute for Water Education", orcid: "0000-0003-7654-3210" }
    ],
    keyTakeaways: [
      "Beef production requires 1,800 gallons of water per pound",
      "Plant-based proteins require significantly less water than meat",
      "Water-intensive crops like almonds and avocados still use less water than beef",
    ],
    content: `Water is a precious resource, and food production accounts for approximately 70% of global freshwater use. Understanding the water footprint of different foods helps us make more sustainable choices. This includes not just drinking water but all water used in growing, processing, and transporting food. Some foods are extremely water-intensive, while others require minimal water input.`,
    sections: [
      {
        title: "Water Requirements by Food",
        content:
          "Beef: 1,800 gallons per pound. Almonds: 1.1 gallons per almond. Avocado: 72 gallons per avocado. Wheat: 1,799 gallons per pound. Lentils: 704 gallons per pound. Tofu: 299 gallons per pound. These differences can guide more water-conscious food choices.",
      },
      {
        title: "Geography and Water Scarcity",
        content:
          "Water-intensive crops grown in water-scarce regions create particular concerns. Almond cultivation in California or date palm cultivation in the Middle East may stress local water supplies. Choosing locally-grown, water-appropriate foods supports regional sustainability.",
      },
      {
        title: "Reducing Your Water Footprint",
        content:
          "Reducing meat consumption, choosing plant-based proteins, and supporting local agriculture are the most impactful steps. Even reducing beef specifically can significantly decrease your water footprint compared to other dietary changes.",
      },
    ],
  },
]

const route = useRoute()
const articleId = computed(() => route.params.id as string)

const article = computed(() => {
  return articles.find(a => a.id === articleId.value)
})

const relatedArticles = computed(() => {
  if (!article.value) return []
  return articles
    .filter(a => a.id !== article.value!.id && a.category === article.value!.category)
    .slice(0, 2)
})

const summaryNotes = ref('')
const loadingSummary = ref(false)
const copied = ref(false)
const userReactions = ref<string[]>([])

const summaryNotesList = computed(() => {
  return summaryNotes.value
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[-•]\s*/, '').trim())
})

const handleReaction = (reaction: string) => {
  const index = userReactions.value.indexOf(reaction)
  if (index > -1) {
    userReactions.value.splice(index, 1)
  } else {
    userReactions.value.push(reaction)
  }
}

const generateSummary = () => {
  if (!article.value) return

  loadingSummary.value = true

  // Simulate AI summary generation
  setTimeout(() => {
    const notes = [
      `${article.value!.keyTakeaways[0]}`,
      `${article.value!.keyTakeaways[1]}`,
      `The article discusses ${article.value!.sections.length} main topics in detail`,
      `Key focus areas: ${article.value!.tags.slice(0, 3).join(', ')}`,
    ]
    summaryNotes.value = notes.join('\n')
    loadingSummary.value = false
  }, 1500)
}

const copyNotesToClipboard = () => {
  navigator.clipboard.writeText(summaryNotes.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

useSeoMeta({
  title: computed(() => article.value ? `${article.value.title} - FoodScholar` : 'Article - FoodScholar'),
  description: computed(() => article.value?.excerpt || 'Learn about nutrition and sustainable eating')
})

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

.prose {
  max-width: none;
}
</style>
