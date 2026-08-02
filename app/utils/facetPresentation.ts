/**
 * Presentation for the annotation facets.
 *
 * The vocabularies themselves are owned by the backend
 * (`catalog/vocabularies.py`) and are closed sets — a value that is not in them
 * cannot appear in a facet. What lives here is purely how to *show* them, so
 * adding a cuisine backend-side degrades to a plain chip rather than breaking.
 *
 * Emoji rather than icons for cuisine and mood: a flag or a dish reads faster
 * than a monochrome glyph when there are thirty of them, and there is no icon
 * set that covers "Slovenian" or "Levantine" sensibly.
 */

/** Cuisine -> emoji. Missing entries render as a plain chip, which is fine. */
export const CUISINE_EMOJI: Record<string, string> = {
  british: '🇬🇧',
  irish: '🇮🇪',
  french: '🇫🇷',
  italian: '🇮🇹',
  spanish: '🇪🇸',
  portuguese: '🇵🇹',
  greek: '🇬🇷',
  mediterranean: '🫒',
  hungarian: '🇭🇺',
  slovenian: '🇸🇮',
  balkan: '🌶️',
  german: '🇩🇪',
  nordic: '🇸🇪',
  polish: '🇵🇱',
  turkish: '🇹🇷',
  middle_eastern: '🧆',
  north_african: '🇲🇦',
  west_african: '🌍',
  indian: '🇮🇳',
  south_asian: '🍛',
  chinese: '🇨🇳',
  japanese: '🇯🇵',
  korean: '🇰🇷',
  thai: '🇹🇭',
  vietnamese: '🇻🇳',
  southeast_asian: '🍜',
  mexican: '🇲🇽',
  caribbean: '🏝️',
  latin_american: '🌎',
  american: '🇺🇸'
}

/** Mood -> emoji. Occasions, not emotions — see the backend vocabulary. */
export const MOOD_EMOJI: Record<string, string> = {
  comfort: '🫂',
  light: '🍃',
  hearty: '🍲',
  fresh: '🌿',
  indulgent: '🍫',
  quick: '⚡',
  festive: '🎉',
  warming: '🔥',
  refreshing: '🧊'
}

/** Flavour -> emoji. */
export const FLAVOR_EMOJI: Record<string, string> = {
  sweet: '🍯',
  sour: '🍋',
  salty: '🧂',
  bitter: '☕',
  umami: '🍄',
  spicy: '🌶️',
  smoky: '🔥',
  herbaceous: '🌿',
  citrusy: '🍊',
  nutty: '🥜',
  creamy: '🥛',
  earthy: '🌰'
}

/** Food group -> emoji. */
export const FOOD_GROUP_EMOJI: Record<string, string> = {
  vegetables: '🥦',
  fruit: '🍎',
  grains: '🌾',
  dairy: '🧀',
  meat: '🥩',
  poultry: '🍗',
  fish: '🐟',
  seafood: '🦐',
  eggs: '🥚',
  legumes: '🫘',
  nuts_and_seeds: '🌰',
  herbs_and_spices: '🌿',
  sugars: '🍬'
}

/**
 * `middle_eastern` -> `Middle Eastern`, `main-dish` -> `Main Dish`.
 *
 * The vocabularies are snake_case slugs and no facet carries a display label,
 * so every surface that shows one has to derive it. This was copied into two
 * components before it lived here.
 */
export function humanizeFacet(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export interface AnnotationFacetSpec {
  /** Field name on the recipe payload — also the facet bucket key. */
  key: 'cuisines' | 'moods' | 'flavor_profiles' | 'food_groups'
  title: string
  icon: string
  emojis: Record<string, string>
}

/**
 * The four annotation facets in one list, so the card, the detail page and the
 * filter panel cannot drift into disagreeing about what an annotation is
 * called or which emoji it gets.
 *
 * Order is cuisine -> mood -> flavour -> food group: most specific first.
 * "Italian" narrows a recipe far more than "vegetables" does.
 */
export const ANNOTATION_FACETS: readonly AnnotationFacetSpec[] = [
  { key: 'cuisines', title: 'Cuisine', icon: 'i-lucide-globe', emojis: CUISINE_EMOJI },
  { key: 'moods', title: 'Mood', icon: 'i-lucide-heart', emojis: MOOD_EMOJI },
  { key: 'flavor_profiles', title: 'Flavour', icon: 'i-lucide-flame', emojis: FLAVOR_EMOJI },
  { key: 'food_groups', title: 'Food Groups', icon: 'i-lucide-apple', emojis: FOOD_GROUP_EMOJI }
] as const
