/**
 * The allergen vocabulary every WiseFood surface agrees on.
 *
 * RecipeWrangler matches a profile's allergies and a search's exclusions
 * exactly against its graph (`toLower(al.name) IN $exclude_allergens`) and its
 * index (`terms: { allergens }`), so the strings the UI stores and sends have
 * to be the identifiers the graph carries. The profile picker used to store
 * `dairy`, `nuts` and `shellfish`; none of those matched anything, so a
 * declared allergy excluded nothing and nothing reported it.
 *
 * The identifiers are the EU's fourteen declaration groups (Regulation
 * 1169/2011, Annex II) plus `wheat`, which RecipeWrangler keeps as a
 * compatibility identifier under the gluten group. The gateway
 * (`wisefood-api/src/allergens.py`) and RecipeWrangler
 * (`recipe_wrangler/utils/food_ontology.py`) hold the same table and fold
 * whatever they receive through it, so an old value still works end to end;
 * this copy exists so the UI shows the right chip for an old value and sends
 * the canonical one.
 */

/**
 * Every identifier a filter can exclude, in the order the chips show: the EU
 * groups in Annex order, with `wheat` beside the gluten group it belongs to.
 * The graph tags `wheat` on its own (flour, bread, pasta ...) so a cook can
 * exclude it without excluding every cereal; `gluten` implies `wheat` on the
 * backend.
 */
export const CANONICAL_ALLERGEN_IDS = [
  'gluten',
  'wheat',
  'crustacean_shellfish',
  'egg',
  'fish',
  'peanut',
  'soy',
  'milk',
  'tree_nut',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs'
] as const

export type AllergenId = (typeof CANONICAL_ALLERGEN_IDS)[number]

export interface AllergenOption {
  value: AllergenId
  icon: string
}

const ALLERGEN_ICONS: Readonly<Record<AllergenId, string>> = {
  gluten: 'i-lucide-wheat',
  wheat: 'i-lucide-wheat',
  crustacean_shellfish: 'i-lucide-shell',
  egg: 'i-lucide-egg',
  fish: 'i-lucide-fish',
  peanut: 'i-lucide-nut',
  soy: 'i-lucide-bean',
  milk: 'i-lucide-milk',
  tree_nut: 'i-lucide-nut',
  celery: 'i-lucide-leaf',
  mustard: 'i-lucide-droplet',
  sesame: 'i-lucide-circle-dot',
  sulphites: 'i-lucide-flask-conical',
  lupin: 'i-lucide-flower',
  molluscs: 'i-lucide-shell'
}

/** What a recipe filter can exclude: the EU groups plus `wheat`. */
export const ALLERGEN_FILTER_OPTIONS: readonly AllergenOption[] = CANONICAL_ALLERGEN_IDS.map(value => ({
  value,
  icon: ALLERGEN_ICONS[value]
}))

/** The fourteen EU declaration groups a profile can declare, in Annex II order. */
export const EU_ALLERGENS: readonly AllergenOption[] = ALLERGEN_FILTER_OPTIONS.filter(option => option.value !== 'wheat')

/** English fallback labels, for console pages that do not go through i18n. */
export const ALLERGEN_LABELS_EN: Readonly<Record<AllergenId, string>> = {
  gluten: 'Cereals containing gluten',
  crustacean_shellfish: 'Crustaceans',
  egg: 'Eggs',
  fish: 'Fish',
  peanut: 'Peanuts',
  soy: 'Soybeans',
  milk: 'Milk',
  tree_nut: 'Nuts',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame seeds',
  sulphites: 'Sulphur dioxide and sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
  wheat: 'Wheat'
}

/**
 * What callers actually stored or typed, mapped to the identifier(s) it means.
 * Keys are compared after `allergenKey` folding (case, hyphens, underscores,
 * surrounding whitespace) and a trailing "s" is tried on a miss, so plurals
 * need no entries of their own. A bare `shellfish` means both crustaceans and
 * molluscs: an allergy, so the wider reading is the safe one.
 */
export const ALLERGEN_ALIASES: Readonly<Record<string, readonly AllergenId[]>> = {
  // cereals containing gluten
  'cereals containing gluten': ['gluten'],
  'gluten containing cereals': ['gluten'],
  'wheat gluten': ['gluten'],
  'coeliac': ['gluten'],
  'celiac': ['gluten'],
  'rye': ['gluten'],
  'barley': ['gluten'],
  'oat': ['gluten'],
  'spelt': ['gluten'],
  'kamut': ['gluten'],
  'khorasan': ['gluten'],
  'khorasan wheat': ['gluten'],
  // crustaceans
  'crustacean': ['crustacean_shellfish'],
  'crab': ['crustacean_shellfish'],
  'prawn': ['crustacean_shellfish'],
  'shrimp': ['crustacean_shellfish'],
  'lobster': ['crustacean_shellfish'],
  'crayfish': ['crustacean_shellfish'],
  'langoustine': ['crustacean_shellfish'],
  'scampi': ['crustacean_shellfish'],
  'shellfish': ['crustacean_shellfish', 'molluscs'],
  'seafood': ['fish', 'crustacean_shellfish', 'molluscs'],
  // eggs
  'hen egg': ['egg'],
  'hens egg': ['egg'],
  'hen\'s egg': ['egg'],
  // fish
  'finfish': ['fish'],
  // peanuts
  'groundnut': ['peanut'],
  'ground nut': ['peanut'],
  'monkey nut': ['peanut'],
  'arachis': ['peanut'],
  // soybeans
  'soya': ['soy'],
  'soja': ['soy'],
  'soybean': ['soy'],
  'soy bean': ['soy'],
  'soya bean': ['soy'],
  // milk
  'dairy': ['milk'],
  'dairy product': ['milk'],
  'milk product': ['milk'],
  'milk protein': ['milk'],
  'cow milk': ['milk'],
  'cows milk': ['milk'],
  'cow\'s milk': ['milk'],
  'lactose': ['milk'],
  'casein': ['milk'],
  'whey': ['milk'],
  // nuts
  'nut': ['tree_nut'],
  'treenut': ['tree_nut'],
  'almond': ['tree_nut'],
  'hazelnut': ['tree_nut'],
  'walnut': ['tree_nut'],
  'cashew': ['tree_nut'],
  'cashew nut': ['tree_nut'],
  'pecan': ['tree_nut'],
  'pecan nut': ['tree_nut'],
  'brazil nut': ['tree_nut'],
  'pistachio': ['tree_nut'],
  'pistachio nut': ['tree_nut'],
  'macadamia': ['tree_nut'],
  'macadamia nut': ['tree_nut'],
  'queensland nut': ['tree_nut'],
  // celery
  'celeriac': ['celery'],
  'celery root': ['celery'],
  'celery seed': ['celery'],
  // mustard
  'mustard seed': ['mustard'],
  // sesame seeds
  'sesame seed': ['sesame'],
  'sesamum': ['sesame'],
  // sulphur dioxide and sulphites
  'sulphite': ['sulphites'],
  'sulfite': ['sulphites'],
  'sulfites': ['sulphites'],
  'sulphur dioxide': ['sulphites'],
  'sulfur dioxide': ['sulphites'],
  'sulphur dioxide and sulphites': ['sulphites'],
  'sulfur dioxide and sulfites': ['sulphites'],
  'so2': ['sulphites'],
  'metabisulphite': ['sulphites'],
  'metabisulfite': ['sulphites'],
  // lupin
  'lupine': ['lupin'],
  'lupini': ['lupin'],
  'lupin bean': ['lupin'],
  'lupini bean': ['lupin'],
  'lupin flour': ['lupin'],
  // molluscs
  'mollusc': ['molluscs'],
  'mollusk': ['molluscs'],
  'mollusc shellfish': ['molluscs'],
  'mussel': ['molluscs'],
  'oyster': ['molluscs'],
  'clam': ['molluscs'],
  'scallop': ['molluscs'],
  'squid': ['molluscs'],
  'calamari': ['molluscs'],
  'octopus': ['molluscs'],
  'cuttlefish': ['molluscs'],
  'snail': ['molluscs'],
  'escargot': ['molluscs'],
  'cockle': ['molluscs'],
  'whelk': ['molluscs'],
  'abalone': ['molluscs']
}

const CANONICAL_BY_KEY: ReadonlyMap<string, AllergenId> = new Map(
  CANONICAL_ALLERGEN_IDS.map(id => [id.replace(/_/g, ' '), id])
)

/** Fold a stored or typed spelling to the form the alias table is keyed by. */
export function allergenKey(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function lookup(key: string): readonly AllergenId[] | null {
  const canonical = CANONICAL_BY_KEY.get(key)
  if (canonical) return [canonical]
  return ALLERGEN_ALIASES[key] ?? null
}

/**
 * The canonical identifier(s) one stored or typed name means, or `null` when
 * the vocabulary does not know it. "kiwi" is a real allergy and must still
 * reach the backend as itself, so an unknown name is never dropped and never
 * guessed at.
 */
export function canonicalAllergenIds(value: unknown): AllergenId[] | null {
  const key = allergenKey(value)
  if (!key) return null
  let found = lookup(key)
  if (!found && key.endsWith('s') && key.length > 3 && !key.endsWith('ss')) {
    found = lookup(key.slice(0, -1))
  }
  return found ? [...found] : null
}

export function isCanonicalAllergen(value: unknown): value is AllergenId {
  return typeof value === 'string' && (CANONICAL_ALLERGEN_IDS as readonly string[]).includes(value)
}

/**
 * Canonical identifiers for a list of allergen names, in first-seen order.
 * Known names and aliases become their identifier(s); unknown names pass
 * through lower-cased and whitespace-folded; empties drop and duplicates
 * collapse, so `['Dairy', 'milk', 'eggs']` is `['milk', 'egg']`.
 */
export function normalizeAllergens(values: readonly unknown[] | null | undefined): string[] {
  const out: string[] = []
  for (const value of values ?? []) {
    const ids: readonly string[] = canonicalAllergenIds(value) ?? (allergenKey(value) ? [allergenKey(value)] : [])
    for (const id of ids) {
      if (!out.includes(id)) out.push(id)
    }
  }
  return out
}

export function allergenLabelKey(id: AllergenId): string {
  return `allergens.labels.${id}`
}

export function allergenHintKey(id: AllergenId): string {
  return `allergens.hints.${id}`
}

/** "kiwi_fruit" → "Kiwi fruit", for a value the vocabulary does not know. */
export function humanizeAllergen(value: unknown): string {
  const text = allergenKey(value)
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

/** English label for a canonical identifier, or a humanised fallback. */
export function allergenLabelEn(value: unknown): string {
  const ids = canonicalAllergenIds(value)
  return ids ? ids.map(id => ALLERGEN_LABELS_EN[id]).join(', ') : humanizeAllergen(value)
}

type Translate = (key: string) => string
type HasTranslation = (key: string) => boolean

/**
 * The localised label for a stored value, canonical or not: an old `dairy`
 * reads as "Milk", a bare `shellfish` as both groups it covers, and a value the
 * vocabulary does not know as itself.
 */
export function allergenLabel(value: unknown, t: Translate, te: HasTranslation): string {
  const ids = canonicalAllergenIds(value)
  if (!ids) return humanizeAllergen(value)
  return ids
    .map((id) => {
      const key = allergenLabelKey(id)
      return te(key) ? t(key) : ALLERGEN_LABELS_EN[id]
    })
    .join(', ')
}
