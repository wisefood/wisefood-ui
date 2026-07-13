/**
 * Normalize a nutri score to its letter grade.
 *
 * The Elasticsearch-backed API returns label strings ("Nutriscore_A");
 * the legacy Neo4j path returned numeric Nutri-Score points. Accept both,
 * plus bare letters, and return null when the value is unrecognizable.
 */
export const getNutriScoreGrade = (score: unknown): string | null => {
  if (score === null || score === undefined || score === '') return null

  if (typeof score === 'string') {
    const label = score.trim().toUpperCase()
    if (/^[A-E]$/.test(label)) return label
    const last = label.slice(-1)
    if (label.startsWith('NUTRISCORE') && /^[A-E]$/.test(last)) return last
    const numeric = Number(label)
    return Number.isFinite(numeric) ? gradeFromPoints(numeric) : null
  }

  if (typeof score === 'number' && Number.isFinite(score)) {
    return gradeFromPoints(score)
  }

  return null
}

const gradeFromPoints = (points: number): string => {
  // Official food thresholds: A ≤ -1, B 0-2, C 3-10, D 11-18, E ≥ 19.
  if (points < 0) return 'A'
  if (points <= 2) return 'B'
  if (points <= 10) return 'C'
  if (points <= 18) return 'D'
  return 'E'
}
