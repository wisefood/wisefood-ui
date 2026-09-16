<!--
  Food composition tables.

  A registered reference to a table, not a copy of one — there is no row store
  behind this entity anywhere in the platform. So the figures shown here are
  descriptive: what the table covers and how complete it is. The Source
  Integrator measures them from the file; before this page existed there was
  nowhere to see what it had measured.
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
          </template>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="error"
            class="m-5"
          />

          <div
            v-else-if="loading && !tables.length"
            class="flex items-center gap-2 px-6 py-16 text-sm text-gray-500 dark:text-gray-400"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="h-4 w-4 animate-spin"
            />
            Loading tables…
          </div>

          <p
            v-else-if="!tables.length"
            class="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ query ? 'No tables match that search.' : 'No composition tables yet.' }}
          </p>

          <div
            v-else
            class="divide-y divide-gray-100 dark:divide-white/5"
          >
            <NuxtLink
              v-for="table in tables"
              :key="table.urn"
              :to="`/console/assets/fctables/${encodeURIComponent(table.urn)}`"
              class="flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 sm:px-6 dark:hover:bg-white/5"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ table.title }}
                  </h3>
                  <UBadge
                    size="sm"
                    variant="soft"
                    :color="table.license ? 'neutral' : 'warning'"
                  >
                    {{ table.license || 'licence undetermined' }}
                  </UBadge>
                  <span
                    v-if="table.region"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >{{ table.region }}</span>
                </div>
                <p
                  v-if="table.compiling_institution"
                  class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ table.compiling_institution }}
                </p>
                <p class="mt-1 font-mono text-[11px] text-gray-400 dark:text-gray-500">
                  {{ table.urn }}
                </p>
              </div>
              <div class="shrink-0 space-y-0.5 text-right">
                <p class="text-sm font-medium text-gray-900 tabular-nums dark:text-white">
                  {{ table.number_of_entries != null ? table.number_of_entries.toLocaleString() : '—' }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  entries
                </p>
                <p
                  v-if="table.nutrient_coverage.length"
                  class="text-xs text-gray-400 dark:text-gray-500"
                >
                  {{ table.nutrient_coverage.length }} nutrients
                </p>
              </div>
            </NuxtLink>
          </div>

          <template
            v-if="total > pageSize"
            #footer
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ rangeLabel }}
              </span>
              <UPagination
                v-model:page="page"
                :items-per-page="pageSize"
                :total="total"
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
import { computed, onMounted, ref } from 'vue'
import fctablesApi, { type FCTable } from '~/services/fctablesApi'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Composition Tables · Console' })

const toast = useToast()
const breadcrumbItems = assetSectionBreadcrumb('fctables')

const pageSize = 20
const tables = ref<FCTable[]>([])
const total = ref(0)
const page = ref(1)
const query = ref('')
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

const rangeLabel = computed(() => {
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, total.value)
  return `${start}–${end} of ${total.value.toLocaleString()}`
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await fctablesApi.listTables({
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      q: query.value.trim() || undefined
    })
    tables.value = result.tables
    total.value = result.total
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
