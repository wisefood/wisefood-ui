// Shared helpers for the backend-owned dish-type taxonomy. Labels & icons
// are best-effort display mappings — unknown values fall back to a generic
// title-cased label and a neutral icon so new backend values render cleanly
// without a frontend bump.

const DISH_TYPE_LABEL_OVERRIDES: Record<string, string> = {
  'main-dish': 'Main Dish',
  'side-dish': 'Side Dish'
}

const DISH_TYPE_ICON_MAP: Record<string, string> = {
  'main-dish': 'i-lucide-soup',
  'side-dish': 'i-lucide-salad',
  breakfast: 'i-lucide-sunrise',
  desserts: 'i-lucide-cake',
  beverages: 'i-lucide-coffee',
  snacks: 'i-lucide-cookie'
}

const DISH_TYPE_FALLBACK_ICON = 'i-lucide-utensils'

export function formatDishTypeLabel(value: string): string {
  const key = String(value || '').trim().toLowerCase()
  if (!key) return ''
  if (DISH_TYPE_LABEL_OVERRIDES[key]) return DISH_TYPE_LABEL_OVERRIDES[key]
  return key
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(part => part ? `${part[0]?.toUpperCase() || ''}${part.slice(1)}` : part)
    .join(' ')
}

export function getDishTypeIcon(value: string): string {
  const key = String(value || '').trim().toLowerCase()
  return DISH_TYPE_ICON_MAP[key] || DISH_TYPE_FALLBACK_ICON
}

export function normalizeDishTypes(values?: Array<string | null> | null): string[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const text = String(raw || '').trim().toLowerCase()
    if (!text || seen.has(text)) continue
    seen.add(text)
    out.push(text)
  }
  return out
}
