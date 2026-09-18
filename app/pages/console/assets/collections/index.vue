<!--
  Recipe collections — the sources recipes come from.

  A collection carries the licence and attribution for every recipe under it,
  which is why this section exists: until it did, "may we show this?" was
  answerable only from code.

  The table is fed by `POST /rcollections/search` rather than the list
  endpoint. That matters for more than speed: `fl` means the response carries
  the columns drawn here and nothing else, `fields` returns the facet buckets
  that become the filters, and `total` makes paging honest. The list endpoint
  returns whole documents and no total, so a table built on it ships every
  field to render eight columns and pages blindly.
-->
<template>
  <div>
    <UPage class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <UBreadcrumb
        :items="breadcrumbItems"
        class="mb-4"
      />

      <div class="flex flex-col gap-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          title="Recipe Collections"
          description="The sources recipes come from: what each covers, who compiled it, and what its licence permits."
          :ui="{ root: 'relative py-0 border-b-0' }"
        />
        <div class="flex shrink-0 gap-2 self-start">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            class="cursor-pointer"
            to="/console/assets/collections/import"
          >
            Import a source
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            class="cursor-pointer"
            @click="openCreate"
          >
            Add Collection
          </UButton>
        </div>
      </div>

      <UPageBody class="space-y-6">
        <UCard
          :ui="{ body: 'p-0', header: 'p-5 sm:p-6', footer: 'p-4 sm:px-6 sm:py-4' }"
          class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
        >
          <template #header>
            <div class="space-y-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Collection Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ countLabel }}
                    </UBadge>
                    <UBadge
                      v-if="undeterminedCount"
                      color="warning"
                      variant="soft"
                      class="cursor-pointer"
                      title="A collection with no licence recorded is not one we know we may use"
                      @click="showUndetermined"
                    >
                      {{ undeterminedCount }} without a licence
                    </UBadge>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    A collection carries the licence and attribution for every recipe under it.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UInput
                    v-model="query"
                    leading-icon="i-lucide-search"
                    placeholder="Search title or description"
                    class="w-full sm:w-72"
                    @keydown.enter="applySearch"
                  />
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-refresh-cw"
                    class="cursor-pointer"
                    :loading="loading"
                    @click="load"
                  >
                    Refresh
                  </UButton>
                </div>
              </div>

              <ConsoleCatalogFacetFilters
                v-model="filters"
                :facets="facets"
                :labels="FACET_LABELS"
                @update:model-value="applyFilters"
              />
            </div>
          </template>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="error"
            class="m-5"
          />

          <UTable
            v-else
            :data="collections"
            :columns="columns"
            :loading="loading"
            sticky
            class="min-h-[18rem]"
            @select="openRow"
          >
            <template #empty>
              <p class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {{ query || filters.length
                  ? 'No collections match that search.'
                  : 'No collections yet.' }}
              </p>
            </template>
          </UTable>

          <template
            v-if="pageableTotal > pageSize"
            #footer
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ rangeLabel }}
              </span>
              <UPagination
                v-model:page="page"
                :items-per-page="pageSize"
                :total="pageableTotal"
                @update:page="load"
              />
            </div>
          </template>
        </UCard>
      </UPageBody>
    </UPage>

    <UModal
      v-model:open="creating"
      title="Add a recipe collection"
      description="The minimum a collection needs; everything else is filled in on its page."
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="create"
        >
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="draft.title"
              class="w-full"
              placeholder="Healthy Food Guide"
            />
          </UFormField>
          <UFormField label="Description">
            <UTextarea
              v-model="draft.description"
              class="w-full"
              :rows="3"
            />
          </UFormField>
          <UFormField
            label="Source URL"
            hint="Where the recipes come from"
          >
            <UInput
              v-model="draft.url"
              class="w-full"
              placeholder="https://…"
            />
          </UFormField>
          <UFormField
            label="Licence"
            hint="Leave empty if nobody has established it — that is not the same as permissive"
          >
            <UInput
              v-model="draft.license"
              class="w-full"
              placeholder="CC-BY-4.0"
            />
          </UFormField>
          <UAlert
            v-if="createError"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="createError"
          />
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="creating = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-check"
            class="cursor-pointer"
            :loading="saving"
            :disabled="!draft.title.trim()"
            @click="create"
          >
            Create
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, resolveComponent, ref } from 'vue'
import rcollectionsApi, {
  type Facets, type RecipeCollection
} from '~/services/rcollectionsApi'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Recipe Collections · Console' })

const UBadge = resolveComponent('UBadge')
const toast = useToast()
const breadcrumbItems = assetSectionBreadcrumb('collections')

const FACET_LABELS: Record<string, string> = {
  status: 'Status',
  license: 'Licence',
  language: 'Language',
  source_type: 'Source type',
  review_status: 'Review',
  visibility: 'Visibility'
}

const pageSize = 25
const collections = ref<RecipeCollection[]>([])
const facets = ref<Facets>({})
const total = ref(0)
const maxResultWindow = ref(10000)
const page = ref(1)
const query = ref('')
const filters = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const creating = ref(false)
const saving = ref(false)
const createError = ref<string | null>(null)
const draft = ref({ title: '', description: '', url: '', license: '' })

const countLabel = computed(() =>
  `${total.value.toLocaleString()} collection${total.value === 1 ? '' : 's'}`)

/*
 * From the facet buckets rather than the current page: the catalog counted
 * every collection, so this is the library's exposure and not "how many of
 * the twenty-five on screen".
 */
const undeterminedCount = computed(() => {
  const licences = facets.value['license']
  if (!licences) return 0
  const known = Object.values(licences).reduce((sum, n) => sum + n, 0)
  return Math.max(0, total.value - known)
})

/*
 * The backend refuses an offset past `max_result_window` — that is a rejected
 * request, not an empty page. Paging stops there and the range label says so,
 * rather than offering a page number that returns an error.
 */
const pageableTotal = computed(() => Math.min(total.value, maxResultWindow.value))

const rangeLabel = computed(() => {
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, pageableTotal.value)
  const capped = pageableTotal.value < total.value
  return `${start}–${end} of ${total.value.toLocaleString()}`
    + (capped ? ` (first ${pageableTotal.value.toLocaleString()} reachable)` : '')
})

const dash = (value: unknown) => (value === null || value === undefined || value === '') ? '—' : String(value)

const columns = [
  {
    accessorKey: 'title',
    header: 'Collection',
    cell: ({ row }: { row: { original: RecipeCollection } }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'truncate text-sm font-medium text-gray-900 dark:text-white' },
        row.original.title || 'Untitled'),
      h('p', { class: 'truncate font-mono text-[0.6875rem] text-gray-400 dark:text-gray-500' },
        row.original.urn)
    ])
  },
  {
    accessorKey: 'license',
    header: 'Licence',
    cell: ({ row }: { row: { original: RecipeCollection } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      // Undetermined is not permissive, and the colour should not imply it is.
      color: row.original.license ? 'neutral' : 'warning'
    }, () => row.original.license || 'undetermined')
  },
  {
    accessorKey: 'recipe_count',
    header: 'Recipes',
    cell: ({ row }: { row: { original: RecipeCollection } }) => h(
      'span', { class: 'tabular-nums' },
      row.original.recipe_count != null ? row.original.recipe_count.toLocaleString() : '—')
  },
  {
    accessorKey: 'source_type',
    header: 'Source',
    cell: ({ row }: { row: { original: RecipeCollection } }) => dash(row.original.source_type)
  },
  {
    accessorKey: 'language',
    header: 'Lang',
    cell: ({ row }: { row: { original: RecipeCollection } }) => dash(row.original.language)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: { row: { original: RecipeCollection } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      color: row.original.status === 'active' ? 'success' : 'neutral'
    }, () => row.original.status || '—')
  },
  {
    accessorKey: 'review_status',
    header: 'Review',
    cell: ({ row }: { row: { original: RecipeCollection } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      color: row.original.review_status === 'verified' ? 'success' : 'neutral'
    }, () => row.original.review_status || 'unreviewed')
  },
  {
    accessorKey: 'updated_at',
    header: 'Updated',
    cell: ({ row }: { row: { original: RecipeCollection } }) => {
      const at = row.original.updated_at ? new Date(row.original.updated_at) : null
      return at && !Number.isNaN(at.getTime()) ? at.toLocaleDateString() : '—'
    }
  }
]

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await rcollectionsApi.searchCollections({
      q: query.value.trim() || undefined,
      fq: filters.value,
      limit: pageSize,
      offset: (page.value - 1) * pageSize
    })
    collections.value = result.collections
    total.value = result.total
    maxResultWindow.value = result.maxResultWindow
    // Kept from the first unfiltered load, so narrowing the results does not
    // erase the options you would use to widen them again.
    if (!filters.value.length || !Object.keys(facets.value).length) {
      facets.value = result.facets
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not load collections.'
  } finally {
    loading.value = false
  }
}

function applySearch() {
  page.value = 1
  load()
}

function applyFilters() {
  page.value = 1
  load()
}

function showUndetermined() {
  // There is no bucket for "absent", so this sorts them to the top instead of
  // pretending to filter on a value the catalog never indexed.
  query.value = ''
  filters.value = []
  page.value = 1
  load()
  toast.add({
    title: `${undeterminedCount.value} collections have no licence recorded`,
    description: 'They carry no bucket to filter on — open one to record what its terms permit.',
    icon: 'i-lucide-scale',
    color: 'warning'
  })
}

/* UTable's select handler is (event, row) — the row is the second argument. */
function openRow(_event: Event, row: { original: RecipeCollection }) {
  navigateTo(`/console/assets/collections/${encodeURIComponent(row.original.urn)}`)
}

function openCreate() {
  draft.value = { title: '', description: '', url: '', license: '' }
  createError.value = null
  creating.value = true
}

async function create() {
  if (!draft.value.title.trim()) return
  saving.value = true
  createError.value = null
  try {
    const payload: Record<string, unknown> = { title: draft.value.title.trim() }
    for (const key of ['description', 'url', 'license'] as const) {
      const value = draft.value[key].trim()
      if (value) payload[key] = value
    }
    const created = await rcollectionsApi.createCollection(payload)
    creating.value = false
    toast.add({ title: 'Collection created', icon: 'i-lucide-check', color: 'success' })
    await navigateTo(`/console/assets/collections/${encodeURIComponent(created.urn)}`)
  } catch (caught) {
    createError.value = caught instanceof Error ? caught.message : 'Could not create that collection.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
