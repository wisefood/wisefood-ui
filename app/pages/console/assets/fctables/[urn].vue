<!--
  One composition table.

  The figures here are measured, not typed: `profile_fctable` counts the
  entries, recognises the nutrient columns and works out how much of the grid
  carries a value. Shown read-only for that reason — editing a measurement by
  hand would make it a claim again, and the point of measuring was that nobody
  should have to take the number on trust.
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
        <div class="flex shrink-0 gap-2">
          <UButton
            v-if="table.url"
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            :to="table.url"
            target="_blank"
          >
            Visit source
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            class="cursor-pointer"
            :loading="saving"
            :disabled="!dirty"
            @click="save"
          >
            {{ dirty ? 'Save changes' : 'Saved' }}
          </UButton>
        </div>
      </div>

      <UPageBody class="space-y-6">
        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                What it covers
              </h2>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                measured from the source file
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
              Nutrients
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

          <div
            v-if="table.measurement_units.length || table.reference_portions.length"
            class="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400"
          >
            <span v-if="table.measurement_units.length">
              Units: {{ table.measurement_units.join(', ') }}
            </span>
            <span v-if="table.reference_portions.length">
              Reported {{ table.reference_portions.join(', ') }}
            </span>
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
              <UFormField
                label="Licence"
                hint="Empty means undetermined, not permissive"
              >
                <UInput
                  v-model="form.license"
                  class="w-full"
                  placeholder="CC-BY-4.0"
                />
              </UFormField>
              <UFormField label="Source URL">
                <UInput
                  v-model="form.url"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>
      </UPageBody>
    </template>
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
const error = ref<string | null>(null)

const EDITABLE = [
  'title', 'description', 'compiling_institution', 'database_name',
  'region', 'language', 'license', 'url'
] as const

const form = reactive<Record<string, string>>(
  Object.fromEntries(EDITABLE.map(key => [key, ''])))
const original = ref<Record<string, string>>({})

useHead({ title: () => `${table.value?.title || 'Composition table'} · Console` })

const breadcrumbItems = computed(() => assetSectionBreadcrumb(
  'fctables', [recordCrumb(table.value?.title, 'Table')]))

const dirty = computed(() =>
  EDITABLE.some(key => (form[key] ?? '') !== (original.value[key] ?? '')))

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
  for (const key of EDITABLE) {
    const value = (record as unknown as Record<string, unknown>)[key]
    snapshot[key] = typeof value === 'string' ? value : ''
    form[key] = snapshot[key]
  }
  original.value = snapshot
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
    // Only what changed, so a save never overwrites a field this form does
    // not show or one another curator edited while the page was open.
    const payload: Record<string, string | null> = {}
    for (const key of EDITABLE) {
      if ((form[key] ?? '') !== (original.value[key] ?? '')) {
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

onMounted(load)
</script>
