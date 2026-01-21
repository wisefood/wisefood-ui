// Food preference categories and items
// Foods are tagged with dietary compatibility

export type DietaryGroup = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'flexitarian'

export interface FoodItem {
  id: string
  name: string
  icon: string
  category: string
  // Which diets this food is compatible with
  compatibleWith: DietaryGroup[]
}

export interface FoodCategory {
  id: string
  name: string
  icon: string
}

export const foodCategories: FoodCategory[] = [
  { id: 'proteins', name: 'Proteins', icon: 'i-lucide-beef' },
  { id: 'dairy', name: 'Dairy & Eggs', icon: 'i-lucide-milk' },
  { id: 'grains', name: 'Grains & Carbs', icon: 'i-lucide-wheat' },
  { id: 'vegetables', name: 'Vegetables', icon: 'i-lucide-carrot' },
  { id: 'fruits', name: 'Fruits', icon: 'i-lucide-apple' },
  { id: 'seafood', name: 'Seafood', icon: 'i-lucide-fish' },
  { id: 'nuts', name: 'Nuts & Seeds', icon: 'i-lucide-nut' },
  { id: 'condiments', name: 'Condiments & Sauces', icon: 'i-lucide-droplet' },
  { id: 'beverages', name: 'Beverages', icon: 'i-lucide-cup-soda' }
]

// All diets
const ALL: DietaryGroup[] = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'flexitarian']
// Vegetarian-friendly (no meat/fish)
const VEGETARIAN: DietaryGroup[] = ['omnivore', 'vegetarian', 'flexitarian']
// Vegan-friendly (plant-based only)
const VEGAN: DietaryGroup[] = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'flexitarian']
// Pescatarian-friendly (includes fish)
const PESCATARIAN: DietaryGroup[] = ['omnivore', 'pescatarian', 'flexitarian']
// Meat only (omnivore and flexitarian)
const MEAT_ONLY: DietaryGroup[] = ['omnivore', 'flexitarian']

export const foodItems: FoodItem[] = [
  // Proteins - Meat
  { id: 'chicken', name: 'Chicken', icon: 'i-lucide-drumstick', category: 'proteins', compatibleWith: MEAT_ONLY },
  { id: 'beef', name: 'Beef', icon: 'i-lucide-beef', category: 'proteins', compatibleWith: MEAT_ONLY },
  { id: 'pork', name: 'Pork', icon: 'i-lucide-ham', category: 'proteins', compatibleWith: MEAT_ONLY },
  { id: 'lamb', name: 'Lamb', icon: 'i-lucide-beef', category: 'proteins', compatibleWith: MEAT_ONLY },
  { id: 'turkey', name: 'Turkey', icon: 'i-lucide-bird', category: 'proteins', compatibleWith: MEAT_ONLY },
  { id: 'duck', name: 'Duck', icon: 'i-lucide-bird', category: 'proteins', compatibleWith: MEAT_ONLY },

  // Proteins - Plant-based
  { id: 'tofu', name: 'Tofu', icon: 'i-lucide-square', category: 'proteins', compatibleWith: ALL },
  { id: 'tempeh', name: 'Tempeh', icon: 'i-lucide-rectangle-horizontal', category: 'proteins', compatibleWith: ALL },
  { id: 'seitan', name: 'Seitan', icon: 'i-lucide-circle', category: 'proteins', compatibleWith: ALL },
  { id: 'legumes', name: 'Legumes & Beans', icon: 'i-lucide-bean', category: 'proteins', compatibleWith: ALL },
  { id: 'lentils', name: 'Lentils', icon: 'i-lucide-circle-dot', category: 'proteins', compatibleWith: ALL },
  { id: 'chickpeas', name: 'Chickpeas', icon: 'i-lucide-circle', category: 'proteins', compatibleWith: ALL },

  // Dairy & Eggs
  { id: 'milk', name: 'Milk', icon: 'i-lucide-milk', category: 'dairy', compatibleWith: VEGETARIAN },
  { id: 'cheese', name: 'Cheese', icon: 'i-lucide-sandwich', category: 'dairy', compatibleWith: VEGETARIAN },
  { id: 'yogurt', name: 'Yogurt', icon: 'i-lucide-cup-soda', category: 'dairy', compatibleWith: VEGETARIAN },
  { id: 'butter', name: 'Butter', icon: 'i-lucide-package', category: 'dairy', compatibleWith: VEGETARIAN },
  { id: 'eggs', name: 'Eggs', icon: 'i-lucide-egg', category: 'dairy', compatibleWith: VEGETARIAN },
  { id: 'cream', name: 'Cream', icon: 'i-lucide-droplet', category: 'dairy', compatibleWith: VEGETARIAN },

  // Plant-based dairy alternatives
  { id: 'almond-milk', name: 'Almond Milk', icon: 'i-lucide-glass-water', category: 'dairy', compatibleWith: ALL },
  { id: 'oat-milk', name: 'Oat Milk', icon: 'i-lucide-glass-water', category: 'dairy', compatibleWith: ALL },
  { id: 'soy-milk', name: 'Soy Milk', icon: 'i-lucide-glass-water', category: 'dairy', compatibleWith: ALL },
  { id: 'coconut-yogurt', name: 'Coconut Yogurt', icon: 'i-lucide-cup-soda', category: 'dairy', compatibleWith: ALL },

  // Grains & Carbs
  { id: 'rice', name: 'Rice', icon: 'i-lucide-wheat', category: 'grains', compatibleWith: ALL },
  { id: 'pasta', name: 'Pasta', icon: 'i-lucide-utensils', category: 'grains', compatibleWith: ALL },
  { id: 'bread', name: 'Bread', icon: 'i-lucide-croissant', category: 'grains', compatibleWith: ALL },
  { id: 'quinoa', name: 'Quinoa', icon: 'i-lucide-wheat', category: 'grains', compatibleWith: ALL },
  { id: 'oats', name: 'Oats', icon: 'i-lucide-wheat', category: 'grains', compatibleWith: ALL },
  { id: 'potatoes', name: 'Potatoes', icon: 'i-lucide-potato', category: 'grains', compatibleWith: ALL },
  { id: 'sweet-potato', name: 'Sweet Potato', icon: 'i-lucide-potato', category: 'grains', compatibleWith: ALL },
  { id: 'couscous', name: 'Couscous', icon: 'i-lucide-wheat', category: 'grains', compatibleWith: ALL },
  { id: 'barley', name: 'Barley', icon: 'i-lucide-wheat', category: 'grains', compatibleWith: ALL },

  // Vegetables
  { id: 'broccoli', name: 'Broccoli', icon: 'i-lucide-trees', category: 'vegetables', compatibleWith: ALL },
  { id: 'spinach', name: 'Spinach', icon: 'i-lucide-leaf', category: 'vegetables', compatibleWith: ALL },
  { id: 'carrots', name: 'Carrots', icon: 'i-lucide-carrot', category: 'vegetables', compatibleWith: ALL },
  { id: 'tomatoes', name: 'Tomatoes', icon: 'i-lucide-cherry', category: 'vegetables', compatibleWith: ALL },
  { id: 'onions', name: 'Onions', icon: 'i-lucide-circle', category: 'vegetables', compatibleWith: ALL },
  { id: 'garlic', name: 'Garlic', icon: 'i-lucide-circle', category: 'vegetables', compatibleWith: ALL },
  { id: 'peppers', name: 'Bell Peppers', icon: 'i-lucide-flame', category: 'vegetables', compatibleWith: ALL },
  { id: 'mushrooms', name: 'Mushrooms', icon: 'i-lucide-cloud', category: 'vegetables', compatibleWith: ALL },
  { id: 'zucchini', name: 'Zucchini', icon: 'i-lucide-cylinder', category: 'vegetables', compatibleWith: ALL },
  { id: 'eggplant', name: 'Eggplant', icon: 'i-lucide-egg', category: 'vegetables', compatibleWith: ALL },
  { id: 'cabbage', name: 'Cabbage', icon: 'i-lucide-salad', category: 'vegetables', compatibleWith: ALL },
  { id: 'cauliflower', name: 'Cauliflower', icon: 'i-lucide-cloud', category: 'vegetables', compatibleWith: ALL },
  { id: 'asparagus', name: 'Asparagus', icon: 'i-lucide-tree-pine', category: 'vegetables', compatibleWith: ALL },
  { id: 'cucumber', name: 'Cucumber', icon: 'i-lucide-cylinder', category: 'vegetables', compatibleWith: ALL },
  { id: 'lettuce', name: 'Lettuce', icon: 'i-lucide-salad', category: 'vegetables', compatibleWith: ALL },
  { id: 'kale', name: 'Kale', icon: 'i-lucide-leaf', category: 'vegetables', compatibleWith: ALL },

  // Fruits
  { id: 'apples', name: 'Apples', icon: 'i-lucide-apple', category: 'fruits', compatibleWith: ALL },
  { id: 'bananas', name: 'Bananas', icon: 'i-lucide-banana', category: 'fruits', compatibleWith: ALL },
  { id: 'oranges', name: 'Oranges', icon: 'i-lucide-citrus', category: 'fruits', compatibleWith: ALL },
  { id: 'strawberries', name: 'Strawberries', icon: 'i-lucide-cherry', category: 'fruits', compatibleWith: ALL },
  { id: 'blueberries', name: 'Blueberries', icon: 'i-lucide-grape', category: 'fruits', compatibleWith: ALL },
  { id: 'grapes', name: 'Grapes', icon: 'i-lucide-grape', category: 'fruits', compatibleWith: ALL },
  { id: 'mango', name: 'Mango', icon: 'i-lucide-citrus', category: 'fruits', compatibleWith: ALL },
  { id: 'pineapple', name: 'Pineapple', icon: 'i-lucide-citrus', category: 'fruits', compatibleWith: ALL },
  { id: 'watermelon', name: 'Watermelon', icon: 'i-lucide-circle', category: 'fruits', compatibleWith: ALL },
  { id: 'avocado', name: 'Avocado', icon: 'i-lucide-egg', category: 'fruits', compatibleWith: ALL },
  { id: 'lemon', name: 'Lemon', icon: 'i-lucide-citrus', category: 'fruits', compatibleWith: ALL },
  { id: 'peach', name: 'Peach', icon: 'i-lucide-cherry', category: 'fruits', compatibleWith: ALL },

  // Seafood
  { id: 'salmon', name: 'Salmon', icon: 'i-lucide-fish', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'tuna', name: 'Tuna', icon: 'i-lucide-fish', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'shrimp', name: 'Shrimp', icon: 'i-lucide-shell', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'cod', name: 'Cod', icon: 'i-lucide-fish', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'sardines', name: 'Sardines', icon: 'i-lucide-fish', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'mackerel', name: 'Mackerel', icon: 'i-lucide-fish', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'crab', name: 'Crab', icon: 'i-lucide-shell', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'lobster', name: 'Lobster', icon: 'i-lucide-shell', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'mussels', name: 'Mussels', icon: 'i-lucide-shell', category: 'seafood', compatibleWith: PESCATARIAN },
  { id: 'squid', name: 'Squid', icon: 'i-lucide-octagon', category: 'seafood', compatibleWith: PESCATARIAN },

  // Nuts & Seeds
  { id: 'almonds', name: 'Almonds', icon: 'i-lucide-nut', category: 'nuts', compatibleWith: ALL },
  { id: 'walnuts', name: 'Walnuts', icon: 'i-lucide-nut', category: 'nuts', compatibleWith: ALL },
  { id: 'cashews', name: 'Cashews', icon: 'i-lucide-nut', category: 'nuts', compatibleWith: ALL },
  { id: 'peanuts', name: 'Peanuts', icon: 'i-lucide-nut', category: 'nuts', compatibleWith: ALL },
  { id: 'pistachios', name: 'Pistachios', icon: 'i-lucide-nut', category: 'nuts', compatibleWith: ALL },
  { id: 'sunflower-seeds', name: 'Sunflower Seeds', icon: 'i-lucide-sun', category: 'nuts', compatibleWith: ALL },
  { id: 'chia-seeds', name: 'Chia Seeds', icon: 'i-lucide-circle-dot', category: 'nuts', compatibleWith: ALL },
  { id: 'flax-seeds', name: 'Flax Seeds', icon: 'i-lucide-circle-dot', category: 'nuts', compatibleWith: ALL },
  { id: 'pumpkin-seeds', name: 'Pumpkin Seeds', icon: 'i-lucide-circle', category: 'nuts', compatibleWith: ALL },

  // Condiments & Sauces
  { id: 'olive-oil', name: 'Olive Oil', icon: 'i-lucide-droplet', category: 'condiments', compatibleWith: ALL },
  { id: 'soy-sauce', name: 'Soy Sauce', icon: 'i-lucide-flask-conical', category: 'condiments', compatibleWith: ALL },
  { id: 'vinegar', name: 'Vinegar', icon: 'i-lucide-flask-conical', category: 'condiments', compatibleWith: ALL },
  { id: 'mustard', name: 'Mustard', icon: 'i-lucide-droplet', category: 'condiments', compatibleWith: ALL },
  { id: 'ketchup', name: 'Ketchup', icon: 'i-lucide-droplet', category: 'condiments', compatibleWith: ALL },
  { id: 'mayonnaise', name: 'Mayonnaise', icon: 'i-lucide-droplet', category: 'condiments', compatibleWith: VEGETARIAN },
  { id: 'hot-sauce', name: 'Hot Sauce', icon: 'i-lucide-flame', category: 'condiments', compatibleWith: ALL },
  { id: 'pesto', name: 'Pesto', icon: 'i-lucide-leaf', category: 'condiments', compatibleWith: VEGETARIAN },
  { id: 'hummus', name: 'Hummus', icon: 'i-lucide-circle', category: 'condiments', compatibleWith: ALL },
  { id: 'tahini', name: 'Tahini', icon: 'i-lucide-droplet', category: 'condiments', compatibleWith: ALL },

  // Beverages
  { id: 'coffee', name: 'Coffee', icon: 'i-lucide-coffee', category: 'beverages', compatibleWith: ALL },
  { id: 'tea', name: 'Tea', icon: 'i-lucide-cup-soda', category: 'beverages', compatibleWith: ALL },
  { id: 'juice', name: 'Fruit Juice', icon: 'i-lucide-glass-water', category: 'beverages', compatibleWith: ALL },
  { id: 'smoothies', name: 'Smoothies', icon: 'i-lucide-cup-soda', category: 'beverages', compatibleWith: ALL },
  { id: 'wine', name: 'Wine', icon: 'i-lucide-wine', category: 'beverages', compatibleWith: ALL },
  { id: 'beer', name: 'Beer', icon: 'i-lucide-beer', category: 'beverages', compatibleWith: ALL }
]

/**
 * Get foods compatible with the given dietary groups
 */
export function getCompatibleFoods(dietaryGroups: DietaryGroup[]): FoodItem[] {
  if (!dietaryGroups || dietaryGroups.length === 0) {
    // If no dietary restrictions, return all foods
    return foodItems
  }

  // Find foods that are compatible with ALL selected dietary groups
  return foodItems.filter(food =>
    dietaryGroups.every(diet => food.compatibleWith.includes(diet))
  )
}

/**
 * Get foods by category, filtered by dietary compatibility
 */
export function getFoodsByCategory(categoryId: string, dietaryGroups?: DietaryGroup[]): FoodItem[] {
  const categoryFoods = foodItems.filter(food => food.category === categoryId)

  if (!dietaryGroups || dietaryGroups.length === 0) {
    return categoryFoods
  }

  return categoryFoods.filter(food =>
    dietaryGroups.every(diet => food.compatibleWith.includes(diet))
  )
}

/**
 * Get a food item by ID
 */
export function getFoodById(id: string): FoodItem | undefined {
  return foodItems.find(food => food.id === id)
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): FoodCategory | undefined {
  return foodCategories.find(cat => cat.id === id)
}
