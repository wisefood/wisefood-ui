<script setup lang="ts">
/**
 * Resolve a guideline citation to its guide page.
 *
 * A citation can outlive the rule's public visibility: tips and answers are
 * cached, and a rule can be archived — or never activated — after being cited.
 * Previously any fetch failure became a fatal 404, so those citations dead-ended
 * on an error page.
 *
 * Now the guide is the fallback. `guide`, `region` and `pdf_page` may be
 * supplied on the query by the citing surface — tip evidence carries them for
 * exactly this reason — so even a rule the catalog will not return can still
 * land the reader on the right document at the right page.
 */
import catalogApi from '~/services/catalogApi'
import { buildGuideDetailPath, getGuidelinePageReferences } from '~/utils/guidesCatalog'

definePageMeta({
  middleware: ['auth', 'profile']
})

const route = useRoute()
const guidelineId = decodeURIComponent(String(route.params.id || ''))

const firstQueryValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value
  if (Array.isArray(value)) {
    const found = value.find(item => typeof item === 'string' && item.trim())
    return typeof found === 'string' ? found : null
  }
  return null
}

// Hints from the citing surface, used when the rule itself cannot be read.
const hintedGuideUrn = firstQueryValue(route.query.guide)
const hintedRegion = firstQueryValue(route.query.region)
const hintedPage
  = firstQueryValue(route.query.pdf_page) ?? firstQueryValue(route.query.page_no)

const passthroughQuery = Object.entries(route.query).reduce<Record<string, string | string[]>>(
  (accumulator, [key, value]) => {
    // `guide` and `region` are inputs to this redirect, not state for the target.
    if (key === 'guide' || key === 'region') return accumulator

    if (typeof value === 'string') {
      accumulator[key] = value
      return accumulator
    }
    if (Array.isArray(value)) {
      const values = value.filter((item): item is string => typeof item === 'string')
      if (values.length) accumulator[key] = values
    }
    return accumulator
  },
  {}
)

let guideUrn: string | null = null
let region: string | null = hintedRegion
const query: Record<string, string | string[]> = {
  ...passthroughQuery,
  guideline: guidelineId
}

try {
  const guideline = await catalogApi.getGuideline(guidelineId)
  if (guideline.guide_urn) {
    guideUrn = guideline.guide_urn
    region = guideline.region || region
    query.guideline = guideline.id

    const pageReferences = getGuidelinePageReferences(guideline)
    if (pageReferences.length) {
      // The PDF page to open. Deliberately not `pageRef`, which is a *filter*
      // on the rules list and would hide every other rule on arrival.
      query.pdf_page = String(pageReferences[0])
    }
  }
} catch {
  // Not readable — expected for a rule that is archived, still in draft, or
  // otherwise outside this reader's visibility. Fall through to the hints.
}

if (!guideUrn && hintedGuideUrn) {
  guideUrn = hintedGuideUrn
  if (hintedPage) query.pdf_page = hintedPage
}

if (guideUrn) {
  await navigateTo(
    {
      path: buildGuideDetailPath(region, guideUrn),
      query,
      hash: route.hash
    },
    { redirectCode: 301, replace: true }
  )
} else {
  // Nothing to land on: no readable rule, and no guide hint from the citation.
  throw createError({
    statusCode: 404,
    statusMessage: 'This guideline is no longer available.',
    fatal: true
  })
}
</script>
