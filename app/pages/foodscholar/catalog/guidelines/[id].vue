<script setup lang="ts">
import catalogApi from '~/services/catalogApi'
import { buildGuideDetailPath, getGuidelinePageReferences } from '~/utils/guidesCatalog'

definePageMeta({
  middleware: ['auth', 'profile']
})

const route = useRoute()
const guidelineId = decodeURIComponent(String(route.params.id || ''))

try {
  const guideline = await catalogApi.getGuideline(guidelineId)
  if (!guideline.guide_urn) {
    throw new Error('Guideline is not attached to a guide.')
  }

  const pageReferences = getGuidelinePageReferences(guideline)
  const query = Object.entries(route.query).reduce<Record<string, string | string[]>>((accumulator, [key, value]) => {
    if (typeof value === 'string') {
      accumulator[key] = value
      return accumulator
    }

    if (Array.isArray(value)) {
      const values = value.filter((item): item is string => typeof item === 'string')
      if (values.length) {
        accumulator[key] = values
      }
    }

    return accumulator
  }, {})

  query.guideline = guideline.id

  if (pageReferences.length) {
    query.pageRef = String(pageReferences[0])
    query.view = 'page'
  }

  await navigateTo({
    path: buildGuideDetailPath(guideline.region, guideline.guide_urn),
    query,
    hash: route.hash
  }, {
    redirectCode: 301,
    replace: true
  })
} catch (error) {
  console.error('[CatalogGuidelineAlias] Failed to resolve guideline detail route:', error)

  throw createError({
    statusCode: 404,
    statusMessage: 'Guideline not found',
    fatal: true
  })
}
</script>
