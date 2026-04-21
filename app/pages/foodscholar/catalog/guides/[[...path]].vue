<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile']
})

const route = useRoute()
const destination = route.fullPath.replace(/^\/foodscholar\/catalog\/guides/, '/foodscholar/guides') || '/foodscholar/guides'

await navigateTo(destination, {
  redirectCode: 301,
  replace: true
})
</script>
