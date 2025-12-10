// Mock data for the WiseFood dashboard
export const hero = {
  greeting: "Good morning",
  encouragement: "Here's your food wellness snapshot.",
  wellnessPercent: 72,
  callout: "Balanced carbs today"
}

export const trendingRecipes = [
  { id: 1, title: "Lentil Buddha Bowl", thumb: "/img/lentil.jpg", healthy: true, sustainable: true },
  { id: 2, title: "Oat & Berry Porridge", thumb: "/img/porridge.jpg", healthy: true, sustainable: false },
  { id: 3, title: "Chickpea Salad Wrap", thumb: "/img/chickpea.jpg", healthy: true, sustainable: true }
]

export const rings = [
  { id: "carbs", label: "Carbs", percent: 55, value: "180g" },
  { id: "protein", label: "Protein", percent: 30, value: "65g" },
  { id: "fat", label: "Fat", percent: 15, value: "50g" }
]

export const sustainability = {
  ingredient: "Chickpeas",
  note: "Low water footprint",
  cta: "Explore swaps",
  img: "/img/chickpea.jpg"
}

export const discoveries = [
  { id: 1, title: "New study on fiber intake", summary: "Short 1–2 line summary.", source: "Nature Food", date: "2025-11-01" }
]

export function useDashboardData() {
  return {
    hero,
    trendingRecipes,
    rings,
    sustainability,
    discoveries
  }
}
