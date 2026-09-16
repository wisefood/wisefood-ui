<!--
  One recipe collection, and the fields a curator actually changes.

  Licence and attribution lead, because they are the reason this page exists:
  a collection is what carries them for every recipe underneath it, and until
  now they were editable only by someone who could run a script.
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

    <template v-else-if="collection">
      <div class="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <UPageHeader
          :title="collection.title || 'Untitled collection'"
          :description="collection.urn"
          :ui="{ root: 'relative py-0 border-b-0', description: 'font-mono text-xs' }"
        />
        <div class="flex shrink-0 gap-2">
          <UButton
            v-if="collection.url"
            color="neutral"
            variant="outline"
            icon="i-lucide-external-link"
            :to="collection.url"
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
        <!-- Licence first: it decides whether any of the rest may be shown. -->
        <UCard
          class="border"
          :class="collection.license
            ? 'border-gray-200/70 dark:border-white/10'
            : 'border-amber-200 dark:border-amber-500/30'"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                :name="collection.license ? 'i-lucide-scale' : 'i-lucide-alert-triangle'"
                class="h-4 w-4"
                :class="collection.license ? 'text-gray-400' : 'text-amber-500'"
              />
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                Licence and attribution
              </h2>
            </div>
          </template>

          <p
            v-if="!form.license"
            class="mb-4 text-sm leading-relaxed text-amber-800 dark:text-amber-200"
          >
            Nobody has established what this collection's terms permit. That is not the
            same as permissive — it means the question has not been asked yet, and every
            recipe underneath inherits the uncertainty.
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Licence"
              hint="SPDX-style identifier where there is one"
            >
              <UInput
                v-model="form.license"
                class="w-full"
                placeholder="CC-BY-4.0"
              />
            </UFormField>
            <UFormField
              label="Source URL"
              hint="Where the terms can be read"
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
            <div class="grid gap-4 sm:grid-cols-3">
              <UFormField label="Status">
                <USelectMenu
                  v-model="form.status"
                  value-key="value"
                  :items="STATUSES"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Visibility">
                <USelectMenu
                  v-model="form.visibility"
                  value-key="value"
                  :items="VISIBILITIES"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Language">
                <UInput
                  v-model="form.language"
                  class="w-full"
                  placeholder="en"
                />
              </UFormField>
            </div>
            <UFormField
              label="Curation notes"
              hint="What a future curator needs to know about this source"
            >
              <UTextarea
                v-model="form.curation_notes"
                class="w-full"
                :rows="3"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Measured, not typed: these come from the corpus itself. -->
        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              What it holds
            </h2>
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
          <div
            v-if="collection.cuisines.length || collection.dietary_patterns.length"
            class="mt-4 flex flex-wrap gap-1.5"
          >
            <UBadge
              v-for="tag in [...collection.cuisines, ...collection.dietary_patterns]"
              :key="tag"
              size="sm"
              variant="soft"
              color="neutral"
            >
              {{ tag }}
            </UBadge>
          </div>
        </UCard>
      </UPageBody>
    </template>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import rcollectionsApi, { type RecipeCollection } from '~/services/rcollectionsApi'
import { assetSectionBreadcrumb, recordCrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const urn = computed(() => String(route.params.urn ?? ''))

const collection = ref<RecipeCollection | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const EDITABLE = [
  'title', 'description', 'url', 'license', 'language',
  'status', 'visibility', 'curation_notes'
] as const

const form = reactive<Record<string, string>>(
  Object.fromEntries(EDITABLE.map(key => [key, ''])))
const original = ref<Record<string, string>>({})

const STATUSES = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Deprecated', value: 'deprecated' }
]
const VISIBILITIES = [
  { label: 'Internal', value: 'internal' },
  { label: 'Public', value: 'public' }
]

useHead({ title: () => `${collection.value?.title || 'Collection'} · Console` })

const breadcrumbItems = computed(() => assetSectionBreadcrumb(
  'collections', [recordCrumb(collection.value?.title, 'Collection')]))

const dirty = computed(() =>
  EDITABLE.some(key => (form[key] ?? '') !== (original.value[key] ?? '')))

const facts = computed(() => {
  const c = collection.value
  if (!c) return []
  return [
    { label: 'Recipes', value: c.recipe_count?.toLocaleString() ?? '—' },
    { label: 'Nutrition data', value: c.has_nutritional_data === null ? '—' : (c.has_nutritional_data ? 'yes' : 'no') },
    { label: 'Images', value: c.has_images === null ? '—' : (c.has_images ? 'yes' : 'no') },
    { label: 'Completeness', value: c.data_completeness != null ? `${Math.round(c.data_completeness)}%` : '—' }
  ]
})

function fill(record: RecipeCollection) {
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
    const record = await rcollectionsApi.getCollection(urn.value)
    collection.value = record
    fill(record)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not load that collection.'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!dirty.value) return
  saving.value = true
  try {
    /*
     * Only what changed. A PATCH of every field would overwrite anything
     * another curator edited while this page was open, and would rewrite
     * fields this form does not show at all.
     */
    const payload: Record<string, string | null> = {}
    for (const key of EDITABLE) {
      if ((form[key] ?? '') !== (original.value[key] ?? '')) {
        payload[key] = form[key]?.trim() ? form[key].trim() : null
      }
    }
    const updated = await rcollectionsApi.updateCollection(urn.value, payload)
    collection.value = updated
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
