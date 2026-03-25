<script setup lang="ts">
import { buildGuideRoutePath } from '~/utils/consoleGuideCatalog'

const route = useRoute()
const legacyGuideQuery = Array.isArray(route.query.guide) ? route.query.guide[0] : route.query.guide

const nextQuery = {
  ...route.query,
  guide: undefined,
  tab: 'artifacts'
}

await navigateTo({
  path: typeof legacyGuideQuery === 'string' && legacyGuideQuery
    ? buildGuideRoutePath(legacyGuideQuery)
    : '/console/assets/guides',
  query: nextQuery
}, {
  replace: true
})
</script>
