// Constants for breakpoints and microcopy used throughout the dashboard
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
}

export const MICROCOPY = {
  hero: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    defaultEncouragement: "Here's your food wellness snapshot.",
  },
  quickActions: {
    scholar: 'Ask FoodScholar',
    analyze: 'Analyze Recipe',
    mealPlan: 'Generate Meal Plan',
  },
  sustainability: {
    explore: 'Explore swaps',
    learnMore: 'Learn more',
  },
  accessibility: {
    wellnessRing: 'Wellness ring showing',
    macroRing: 'ring indicator',
    saveRecipe: 'Save recipe',
    unsaveRecipe: 'Remove saved recipe',
  },
}

export const TIME_OF_DAY = {
  morning: { start: 5, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 5 },
}
