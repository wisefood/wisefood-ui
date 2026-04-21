import type { RecipeIngredient, RecipeSearchResult } from '~/services/recipeApi'

type ErrorRecord = Record<string, unknown>

function asErrorRecord(value: unknown): ErrorRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as ErrorRecord
}

export function buildConsoleRecipeRoutePath(recipeId: string) {
  return `/console/assets/recipes/${encodeURIComponent(recipeId)}`
}

export function resolveRecipeIdentifier(recipe: Pick<RecipeSearchResult, 'recipe_id' | 'id'> | { recipe_id?: string, id?: string }) {
  const recipeId = typeof recipe.recipe_id === 'string' ? recipe.recipe_id.trim() : ''
  if (recipeId) {
    return recipeId
  }

  return typeof recipe.id === 'string' ? recipe.id.trim() : ''
}

export function normalizeRecipeImageUrl(url?: string | null): string | null {
  const normalized = String(url || '').trim()
  if (!normalized) {
    return null
  }

  if (normalized.startsWith('http://')) {
    return `https://${normalized.slice('http://'.length)}`
  }

  return normalized
}

export function formatConsoleRecipeIngredient(ingredient: Pick<RecipeIngredient, 'name' | 'measurement'>) {
  const measurement = String(ingredient.measurement || '').trim()
  const name = String(ingredient.name || '').trim()
  return [measurement, name].filter(Boolean).join(' ')
}

export function parseConsoleTokenList(value: string) {
  return Array.from(
    new Set(
      String(value || '')
        .split(/[\n,]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  )
}

function extractErrorDetail(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (Array.isArray(value)) {
    const messages = value
      .map(item => {
        if (typeof item === 'string' && item.trim()) {
          return item
        }

        const record = asErrorRecord(item)
        const message = typeof record?.msg === 'string' ? record.msg : null
        if (message?.trim()) {
          return message
        }

        return record?.detail ? extractErrorDetail(record.detail) : null
      })
      .filter((item): item is string => Boolean(item))

    return messages.length ? messages.join(' ') : null
  }

  const record = asErrorRecord(value)
  if (record?.detail !== undefined) {
    return extractErrorDetail(record.detail)
  }

  return null
}

export function resolveConsoleRecipeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  const record = asErrorRecord(error)
  const detail = record?.data !== undefined ? extractErrorDetail(record.data) : null
  if (detail) {
    return detail
  }

  const message = typeof record?.message === 'string' ? record.message : null
  if (message?.trim()) {
    return message
  }

  return fallback
}
