import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Returns the appropriate greeting key based on current hour
function getGreetingKey(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return 'morning'
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon'
  } else {
    return 'evening'
  }
}

// Mock data for the WiseFood dashboard
export const hero = {
  wellnessPercent: 72,
  callout: "Balanced carbs today"
}

export const spotlight = {
  title: "Mediterranean Quinoa Bowl",
  description: "A nutrient-rich meal perfectly balanced for your goals. Packed with protein, healthy fats, and complex carbs to fuel your day."
}

export const trendingRecipes = [
  { id: 1, title: "Lentil Buddha Bowl", thumb: "/img/lentil.jpg", healthy: true, sustainable: true },
  { id: 2, title: "Oat & Berry Porridge", thumb: "/img/porridge.jpg", healthy: true, sustainable: false },
  { id: 3, title: "Chickpea Salad Wrap", thumb: "/img/chickpea.jpg", healthy: true, sustainable: true }
]

export const rings = [
  { id: "carbs", label: "Carbs", percent: 65, value: "180g" },
  { id: "protein", label: "Protein", percent: 80, value: "65g" },
  { id: "fat", label: "Fat", percent: 45, value: "50g" }
]

export const sustainability = {
  ingredient: "Chickpeas",
  note: "Low water footprint, high protein",
  cta: "Explore swaps",
  img: "/img/chickpea.jpg"
}

export const discoveries = [
  { id: 1, title: "New study on fiber intake", summary: "Recent research shows that increasing fiber intake to 30g daily can improve gut health and reduce inflammation markers by up to 25%.", source: "Nature Food", date: "2025-11-01" }
]

export function useDashboardData() {
  const { t } = useI18n()

  const greeting = computed(() => {
    const key = getGreetingKey()
    return t(`dashboard.greeting.${key}`)
  })

  const encouragement = computed(() => t('dashboard.encouragement'))

  return {
    hero,
    greeting,
    encouragement,
    spotlight,
    trendingRecipes,
    rings,
    sustainability,
    discoveries
  }
}
