<script setup lang="ts">
import catalogApi from '~/services/catalogApi'
import { buildGuideDetailPath } from '~/utils/guidesCatalog'

definePageMeta({
  middleware: ['auth', 'profile']
})

const route = useRoute()
const rawPath = route.params.path
const pathSegments = Array.isArray(rawPath)
  ? rawPath.map(segment => String(segment))
  : typeof rawPath === 'string' && rawPath
    ? [rawPath]
    : []

if (pathSegments.length === 1 && decodeURIComponent(pathSegments[0]).startsWith('urn:guide:')) {
  const guideUrn = decodeURIComponent(pathSegments[0])

  try {
    const guide = await catalogApi.getGuide(guideUrn)

    await navigateTo({
      path: buildGuideDetailPath(guide.region, guide.urn),
      query: route.query,
      hash: route.hash
    }, {
      redirectCode: 301,
      replace: true
    })
  } catch (error) {
    console.warn('[CatalogGuideAlias] Failed to resolve guide via catalog, falling back to direct route:', error)

    await navigateTo({
      path: buildGuideDetailPath(null, guideUrn),
      query: route.query,
      hash: route.hash
    }, {
      replace: true
    })
  }
} else {
  const destination = route.fullPath.replace(/^\/foodscholar\/catalog\/guides/, '/foodscholar/guides') || '/foodscholar/guides'

  await navigateTo(destination, {
    redirectCode: 301,
    replace: true
  })
}
</script>
