<!--
  Editing one food composition table.

  The figures under "Measured" are counted from the source file by
  `profile_fctable` — entries, nutrient columns, how much of the grid carries a
  value — and are read-only for that reason. Letting somebody retype a
  measurement turns it back into a claim, which is exactly what measuring was
  for. Everything a person legitimately decides is editable.

  Saves send only what changed, so one never rewrites a field this form does
  not show or one another curator edited while the page was open.
-->
<template>
  <UPage class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />

    <div
      v-if="loading"
      class="flex items-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="h-4 w-4 animate-spin"
      />
      Loading…
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :description="error"
    />

    <template v-else-if="table">
      <div class="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          :title="table.title || 'Untitled table'"
          :description="table.urn"
          :ui="{ root: 'relative py-0 border-b-0', description: 'font-mono text-xs' }"
        />
        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="table.url"
            color="neutral"
            variant="ghost"
            icon="i-lucide-external-link"
            :to="table.url"
            target="_blank"
          >
            Source
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            class="cursor-pointer"
            :loading="saving"
            :disabled="!dirty"
            @click="save"
          >
            {{ saveLabel }}
          </UButton>
        </div>
      </div>

      <UPageBody class="space-y-6">
        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                Measured
              </h2>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                counted from the source file
              </span>
            </div>
          </template>

          <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              v-for="fact in facts"
              :key="fact.label"
            >
              <dt class="text-xs text-gray-500 dark:text-gray-400">
                {{ fact.label }}
              </dt>
              <dd class="mt-0.5 text-sm font-medium text-gray-900 tabular-nums dark:text-white">
                {{ fact.value }}
              </dd>
            </div>
          </dl>

          <p
            v-if="table.completeness_description"
            class="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400"
          >
            {{ table.completeness_description }}
          </p>

          <div
            v-if="table.nutrient_coverage.length"
            class="mt-4"
          >
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Nutrients recognised
            </p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="nutrient in table.nutrient_coverage"
                :key="nutrient"
                size="sm"
                variant="soft"
                color="neutral"
              >
                {{ nutrient }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <UCard
          class="border"
          :class="form.license
            ? 'border-gray-200/70 dark:border-white/10'
            : 'border-amber-200 dark:border-amber-500/30'"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                :name="form.license ? 'i-lucide-scale' : 'i-lucide-alert-triangle'"
                class="h-4 w-4"
                :class="form.license ? 'text-gray-400' : 'text-amber-500'"
              />
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                Licence
              </h2>
            </div>
          </template>
          <p
            v-if="!form.license"
            class="mb-4 text-sm leading-relaxed text-amber-800 dark:text-amber-200"
          >
            Empty means undetermined, not permissive — the question has not been asked.
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Licence">
              <UInput
                v-model="form.license"
                class="w-full"
                placeholder="CC-BY-4.0"
              />
            </UFormField>
            <UFormField
              label="Source URL"
              hint="Where the table and its terms live"
            >
              <UInput
                v-model="form.url"
                class="w-full"
                placeholder="https://…"
              />
            </UFormField>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              Details
            </h2>
          </template>
          <div class="space-y-4">
            <UFormField label="Title">
              <UInput
                v-model="form.title"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Description">
              <UTextarea
                v-model="form.description"
                class="w-full"
                :rows="3"
              />
            </UFormField>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField label="Compiling institution">
                <UInput
                  v-model="form.compiling_institution"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Database name">
                <UInput
                  v-model="form.database_name"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Region">
                <UInput
                  v-model="form.region"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Language">
                <UInput
                  v-model="form.language"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Status">
                <USelectMenu
                  v-model="form.status"
                  value-key="value"
                  :items="STATUSES"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="External id">
                <UInput
                  v-model="form.external_id"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              Classification and formats
            </h2>
          </template>
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField
              v-for="field in LIST_FIELDS"
              :key="field.key"
              :label="field.label"
            >
              <ConsoleCatalogTagListInput
                v-model="lists[field.key]"
                :placeholder="field.placeholder"
              />
            </UFormField>
          </div>
        </UCard>

        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 p-4 dark:border-red-500/30">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Delete this table
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              This removes the reference. The table itself lives at its source.
            </p>
          </div>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            class="shrink-0 cursor-pointer"
            :loading="deleting"
            @click="confirmDelete = true"
          >
            Delete
          </UButton>
        </div>
      </UPageBody>
    </template>

    <UModal
      v-model:open="confirmDelete"
      title="Delete this composition table?"
      :description="`${table?.title || 'This table'} will be removed from the catalog.`"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="confirmDelete = false"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            class="cursor-pointer"
            :loading="deleting"
            @click="remove"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import fctablesApi, { type FCTable } from '~/services/fctablesApi'
import { assetSectionBreadcrumb, recordCrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const urn = computed(() => String(route.params.urn ?? ''))

const table = ref<FCTable | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)
const error = ref<string | null>(null)

const TEXT_FIELDS = [
  'title', 'description', 'compiling_institution', 'database_name',
  'region', 'language', 'license', 'url', 'status', 'external_id'
] as const

const LIST_FIELDS = [
  { key: 'classification_schemes', label: 'Classification schemes', placeholder: 'FoodEx2' },
  { key: 'standardization_schemes', label: 'Standardisation schemes', placeholder: 'INFOODS' },
  { key: 'data_formats', label: 'Data formats', placeholder: 'xlsx' },
  { key: 'tasks_supported', label: 'Tasks supported', placeholder: 'nutrient lookup' },
  { key: 'measurement_units', label: 'Measurement units', placeholder: 'mg' },
  { key: 'reference_portions', label: 'Reference portions', placeholder: 'per 100 g' },
  { key: 'tags', label: 'Tags', placeholder: 'national' }
] as const

const LIST_KEYS = LIST_FIELDS.map(f => f.key) as readonly string[]

const form = reactive<Record<string, string>>(
  Object.fromEntries(TEXT_FIELDS.map(key => [key, ''])))
const lists = reactive<Record<string, string[]>>(
  Object.fromEntries(LIST_FIELDS.map(f => [f.key, [] as string[]])))
const original = ref<Record<string, string>>({})
const originalLists = ref<Record<string, string[]>>({})

const STATUSES = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deprecated', value: 'deprecated' }
]

useHead({ title: () => `${table.value?.title || 'Composition table'} · Console` })

const breadcrumbItems = computed(() => assetSectionBreadcrumb(
  'fctables', [recordCrumb(table.value?.title, 'Table')]))

const changed = computed(() => {
  const keys: string[] = []
  for (const key of TEXT_FIELDS) {
    if ((form[key] ?? '') !== (original.value[key] ?? '')) keys.push(key)
  }
  for (const key of LIST_KEYS) {
    if (JSON.stringify(lists[key] ?? []) !== JSON.stringify(originalLists.value[key] ?? [])) {
      keys.push(key)
    }
  }
  return keys
})
const dirty = computed(() => changed.value.length > 0)
const saveLabel = computed(() => {
  const n = changed.value.length
  return n ? `Save ${n} change${n === 1 ? '' : 's'}` : 'Saved'
})

const facts = computed(() => {
  const t = table.value
  if (!t) return []
  return [
    { label: 'Entries', value: t.number_of_entries?.toLocaleString() ?? '—' },
    { label: 'Nutrients', value: t.nutrient_coverage.length || '—' },
    {
      label: 'Completeness',
      value: t.completeness_percent != null ? `${t.completeness_percent}%` : '—'
    },
    {
      label: 'Per item',
      value: t.min_nutrients_per_item != null && t.max_nutrients_per_item != null
        ? `${t.min_nutrients_per_item}–${t.max_nutrients_per_item}`
        : '—'
    }
  ]
})

function fill(record: FCTable) {
  const snapshot: Record<string, string> = {}
  for (const key of TEXT_FIELDS) {
    const value = (record as unknown as Record<string, unknown>)[key]
    snapshot[key] = typeof value === 'string' ? value : ''
    form[key] = snapshot[key]
  }
  original.value = snapshot

  const listSnapshot: Record<string, string[]> = {}
  for (const key of LIST_KEYS) {
    const value = (record as unknown as Record<string, unknown>)[key]
    const items = Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
    listSnapshot[key] = [...items]
    lists[key] = [...items]
  }
  originalLists.value = listSnapshot
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const record = await fctablesApi.getTable(urn.value)
    table.value = record
    fill(record)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not load that table.'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!dirty.value) return
  saving.value = true
  try {
    const payload: Record<string, unknown> = {}
    for (const key of changed.value) {
      if (LIST_KEYS.includes(key)) {
        payload[key] = lists[key]
      } else {
        payload[key] = form[key]?.trim() ? form[key].trim() : null
      }
    }
    const updated = await fctablesApi.updateTable(urn.value, payload)
    table.value = updated
    fill(updated)
    toast.add({ title: 'Saved', icon: 'i-lucide-check', color: 'success' })
  } catch (caught) {
    toast.add({
      title: caught instanceof Error ? caught.message : 'Could not save those changes.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    saving.value = false
  }
}

async function remove() {
  deleting.value = true
  try {
    await fctablesApi.deleteTable(urn.value)
    toast.add({ title: 'Table deleted', icon: 'i-lucide-check', color: 'success' })
    await navigateTo('/console/assets/fctables')
  } catch (caught) {
    toast.add({
      title: caught instanceof Error ? caught.message : 'Could not delete that table.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}

onMounted(load)
</script>
