<!--
  Editing one recipe collection.

  Licence and attribution lead, because they are why this page exists: a
  collection carries them for every recipe underneath it, and until this
  section existed they were editable only by someone who could run a script.

  Saves send only what changed. A full-field PATCH would rewrite fields this
  form does not show and overwrite whatever another curator edited while the
  page was open — and on a record that governs reuse rights, that is not a
  theoretical concern.
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
        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="collection.url"
            color="neutral"
            variant="ghost"
            icon="i-lucide-external-link"
            :to="collection.url"
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
                Licence and attribution
              </h2>
            </div>
          </template>

          <p
            v-if="!form.license"
            class="mb-4 text-sm leading-relaxed text-amber-800 dark:text-amber-200"
          >
            Nobody has established what this collection's terms permit. That is not
            the same as permissive — it means the question has not been asked, and
            every recipe underneath inherits the uncertainty.
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
              <UFormField label="Source type">
                <USelectMenu
                  v-model="form.source_type"
                  value-key="value"
                  :items="SOURCE_TYPES"
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
              <UFormField label="Version">
                <UInput
                  v-model="form.version"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Review status">
                <USelectMenu
                  v-model="form.review_status"
                  value-key="value"
                  :items="REVIEW_STATUSES"
                  class="w-full"
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

        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
              What it covers
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

        <UCard :ui="{ body: 'p-5 sm:p-6' }">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                Measured
              </h2>
              <span class="text-xs text-gray-400 dark:text-gray-500">from the corpus</span>
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
        </UCard>

        <div class="flex items-center justify-between gap-3 rounded-xl border border-red-200 p-4 dark:border-red-500/30">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Delete this collection
            </p>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              The recipes that reference it are not deleted, and will point at a
              collection that no longer exists.
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
      title="Delete this collection?"
      :description="`${collection?.title || 'This collection'} will be removed. Recipes referencing it are left in place.`"
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
import rcollectionsApi, { type RecipeCollection } from '~/services/rcollectionsApi'
import { assetSectionBreadcrumb, recordCrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const urn = computed(() => String(route.params.urn ?? ''))

const collection = ref<RecipeCollection | null>(null)
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)
const error = ref<string | null>(null)

const TEXT_FIELDS = [
  'title', 'description', 'url', 'license', 'language', 'version',
  'status', 'visibility', 'source_type', 'review_status', 'curation_notes'
] as const

const LIST_FIELDS = [
  { key: 'cuisines', label: 'Cuisines', placeholder: 'Irish' },
  { key: 'dietary_patterns', label: 'Dietary patterns', placeholder: 'vegetarian' },
  { key: 'meal_types', label: 'Meal types', placeholder: 'dinner' },
  { key: 'geographic_coverage', label: 'Geographic coverage', placeholder: 'IE' },
  { key: 'tags', label: 'Tags', placeholder: 'curated' }
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
const VISIBILITIES = [
  { label: 'Internal', value: 'internal' },
  { label: 'Public', value: 'public' }
]
const SOURCE_TYPES = [
  { label: 'Web portal', value: 'web_portal' },
  { label: 'Database', value: 'database' },
  { label: 'Book', value: 'book' },
  { label: 'Journal', value: 'journal' },
  { label: 'Other', value: 'other' }
]
const REVIEW_STATUSES = [
  { label: 'Unreviewed', value: 'unreviewed' },
  { label: 'Pending review', value: 'pending_review' },
  { label: 'In review', value: 'in_review' },
  { label: 'Verified', value: 'verified' },
  { label: 'Changes requested', value: 'changes_requested' },
  { label: 'Rejected', value: 'rejected' }
]

useHead({ title: () => `${collection.value?.title || 'Collection'} · Console` })

const breadcrumbItems = computed(() => assetSectionBreadcrumb(
  'collections', [recordCrumb(collection.value?.title, 'Collection')]))

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
  const c = collection.value
  if (!c) return []
  const yesNo = (v: boolean | null) => v === null ? '—' : (v ? 'yes' : 'no')
  return [
    { label: 'Recipes', value: c.recipe_count?.toLocaleString() ?? '—' },
    { label: 'Nutrition data', value: yesNo(c.has_nutritional_data) },
    { label: 'Images', value: yesNo(c.has_images) },
    { label: 'Completeness', value: c.data_completeness != null ? `${Math.round(c.data_completeness)}%` : '—' }
  ]
})

function fill(record: RecipeCollection) {
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
    const payload: Record<string, unknown> = {}
    for (const key of changed.value) {
      if (LIST_KEYS.includes(key)) {
        payload[key] = lists[key]
      } else {
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

async function remove() {
  deleting.value = true
  try {
    await rcollectionsApi.deleteCollection(urn.value)
    toast.add({ title: 'Collection deleted', icon: 'i-lucide-check', color: 'success' })
    await navigateTo('/console/assets/collections')
  } catch (caught) {
    toast.add({
      title: caught instanceof Error ? caught.message : 'Could not delete that collection.',
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
