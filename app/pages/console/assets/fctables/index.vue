<!--
  Food composition tables.

  A registered reference to a table, not a copy of one — there is no row store
  behind this entity anywhere in the platform. So the figures here describe the
  table: how many entries, which nutrients, how much of the grid carries a
  value. The Source Integrator measures them from the file; before this section
  existed there was nowhere to see what it had measured.

  Fed by `POST /fctables/search`: `fl` keeps the response to the columns drawn
  below, `fields` returns the facet buckets that become the filters.
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
          title="Composition Tables"
          description="Food composition tables the platform references, with what each covers and how complete it is."
          :ui="{ root: 'relative py-0 border-b-0' }"
        />
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start cursor-pointer"
          @click="openCreate"
        >
          Add Table
        </UButton>
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
                      Table Library
                    </h2>
                    <UBadge
                      color="neutral"
                      variant="outline"
                    >
                      {{ countLabel }}
                    </UBadge>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    These are references. The platform records what a table covers, not its rows.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UInput
                    v-model="query"
                    leading-icon="i-lucide-search"
                    placeholder="Search title or institution"
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
            :data="tables"
            :columns="columns"
            :loading="loading"
            sticky
            class="min-h-[18rem]"
            @select="openRow"
          >
            <template #empty>
              <p class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {{ query || filters.length
                  ? 'No tables match that search.'
                  : 'No composition tables yet.' }}
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
      title="Add a composition table"
      description="A reference to the table. Its figures are measured when a source file is integrated."
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
              placeholder="National Food Composition Database 2023"
            />
          </UFormField>
          <UFormField label="Compiling institution">
            <UInput
              v-model="draft.compiling_institution"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Region">
              <UInput
                v-model="draft.region"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Licence">
              <UInput
                v-model="draft.license"
                class="w-full"
                placeholder="CC-BY-4.0"
              />
            </UFormField>
          </div>
          <UFormField label="Source URL">
            <UInput
              v-model="draft.url"
              class="w-full"
              placeholder="https://…"
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
import fctablesApi, { type Facets, type FCTable } from '~/services/fctablesApi'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Composition Tables · Console' })

const UBadge = resolveComponent('UBadge')
const toast = useToast()
const breadcrumbItems = assetSectionBreadcrumb('fctables')

const FACET_LABELS: Record<string, string> = {
  status: 'Status',
  license: 'Licence',
  region: 'Region',
  language: 'Language',
  compiling_institution: 'Institution'
}

const pageSize = 25
const tables = ref<FCTable[]>([])
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
const draft = ref({
  title: '', compiling_institution: '', region: '', license: '', url: ''
})

const countLabel = computed(() =>
  `${total.value.toLocaleString()} table${total.value === 1 ? '' : 's'}`)

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
    header: 'Table',
    cell: ({ row }: { row: { original: FCTable } }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'truncate text-sm font-medium text-gray-900 dark:text-white' },
        row.original.title || 'Untitled'),
      h('p', { class: 'truncate text-[0.6875rem] text-gray-400 dark:text-gray-500' },
        row.original.compiling_institution || row.original.urn)
    ])
  },
  {
    accessorKey: 'number_of_entries',
    header: 'Entries',
    cell: ({ row }: { row: { original: FCTable } }) => h(
      'span', { class: 'tabular-nums' },
      row.original.number_of_entries != null
        ? row.original.number_of_entries.toLocaleString()
        : '—')
  },
  {
    accessorKey: 'nutrient_coverage',
    header: 'Nutrients',
    cell: ({ row }: { row: { original: FCTable } }) => h(
      'span', { class: 'tabular-nums' },
      row.original.nutrient_coverage.length || '—')
  },
  {
    accessorKey: 'completeness_percent',
    header: 'Complete',
    // A bar rather than a number: completeness is the field somebody scans a
    // table of these to compare, and a percentage read down a column is work.
    cell: ({ row }: { row: { original: FCTable } }) => {
      const pct = row.original.completeness_percent
      if (pct == null) return '—'
      return h('div', { class: 'flex items-center gap-2' }, [
        h('div', { class: 'h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10' }, [
          h('div', {
            class: 'h-full rounded-full bg-brandg-500',
            style: `width: ${Math.min(100, Math.max(0, pct))}%`
          })
        ]),
        h('span', { class: 'text-xs tabular-nums text-gray-500 dark:text-gray-400' },
          `${Math.round(pct)}%`)
      ])
    }
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: ({ row }: { row: { original: FCTable } }) => dash(row.original.region)
  },
  {
    accessorKey: 'license',
    header: 'Licence',
    cell: ({ row }: { row: { original: FCTable } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      color: row.original.license ? 'neutral' : 'warning'
    }, () => row.original.license || 'undetermined')
  },
  {
    accessorKey: 'updated_at',
    header: 'Updated',
    cell: ({ row }: { row: { original: FCTable } }) => {
      const at = row.original.updated_at ? new Date(row.original.updated_at) : null
      return at && !Number.isNaN(at.getTime()) ? at.toLocaleDateString() : '—'
    }
  }
]

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await fctablesApi.searchTables({
      q: query.value.trim() || undefined,
      fq: filters.value,
      limit: pageSize,
      offset: (page.value - 1) * pageSize
    })
    tables.value = result.tables
    total.value = result.total
    maxResultWindow.value = result.maxResultWindow
    if (!filters.value.length || !Object.keys(facets.value).length) {
      facets.value = result.facets
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not load tables.'
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

/* UTable's select handler is (event, row) — the row is the second argument. */
function openRow(_event: Event, row: { original: FCTable }) {
  navigateTo(`/console/assets/fctables/${encodeURIComponent(row.original.urn)}`)
}

function openCreate() {
  draft.value = { title: '', compiling_institution: '', region: '', license: '', url: '' }
  createError.value = null
  creating.value = true
}

async function create() {
  if (!draft.value.title.trim()) return
  saving.value = true
  createError.value = null
  try {
    const payload: Record<string, unknown> = { title: draft.value.title.trim() }
    for (const key of ['compiling_institution', 'region', 'license', 'url'] as const) {
      const value = draft.value[key].trim()
      if (value) payload[key] = value
    }
    const created = await fctablesApi.createTable(payload)
    creating.value = false
    toast.add({ title: 'Table created', icon: 'i-lucide-check', color: 'success' })
    await navigateTo(`/console/assets/fctables/${encodeURIComponent(created.urn)}`)
  } catch (caught) {
    createError.value = caught instanceof Error ? caught.message : 'Could not create that table.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
