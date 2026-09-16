<!--
  Recipe collections — the sources recipes come from.

  This section did not exist until now, which is why the collection a recipe
  belongs to has been editable only by whoever could run a script. A collection
  is what carries the licence and the attribution for every recipe under it, so
  "who may we show this to" was answerable only from code.
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
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="self-start cursor-pointer"
          @click="openCreate"
        >
          Add Collection
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
                    Collection Library
                  </h2>
                  <UBadge
                    color="neutral"
                    variant="outline"
                  >
                    {{ countLabel }}
                  </UBadge>
                  <UBadge
                    v-if="undetermined"
                    color="warning"
                    variant="soft"
                    :title="'A collection with no licence recorded is not a collection we know we may use'"
                  >
                    {{ undetermined }} without a licence
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
            v-else-if="loading && !collections.length"
            class="flex items-center gap-2 px-6 py-16 text-sm text-gray-500 dark:text-gray-400"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="h-4 w-4 animate-spin"
            />
            Loading collections…
          </div>

          <p
            v-else-if="!collections.length"
            class="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {{ query ? 'No collections match that search.' : 'No collections yet.' }}
          </p>

          <div
            v-else
            class="divide-y divide-gray-100 dark:divide-white/5"
          >
            <NuxtLink
              v-for="collection in collections"
              :key="collection.urn"
              :to="`/console/assets/collections/${encodeURIComponent(collection.urn)}`"
              class="flex items-start gap-4 px-5 py-4 transition hover:bg-gray-50 sm:px-6 dark:hover:bg-white/5"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {{ collection.title }}
                  </h3>
                  <UBadge
                    v-if="collection.status"
                    size="sm"
                    variant="soft"
                    :color="collection.status === 'active' ? 'success' : 'neutral'"
                  >
                    {{ collection.status }}
                  </UBadge>
                  <UBadge
                    size="sm"
                    variant="soft"
                    :color="collection.license ? 'neutral' : 'warning'"
                  >
                    {{ collection.license || 'licence undetermined' }}
                  </UBadge>
                </div>
                <p
                  v-if="collection.description"
                  class="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ collection.description }}
                </p>
                <p class="mt-1 font-mono text-[11px] text-gray-400 dark:text-gray-500">
                  {{ collection.urn }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-sm font-medium text-gray-900 tabular-nums dark:text-white">
                  {{ collection.recipe_count != null ? collection.recipe_count.toLocaleString() : '—' }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  recipes
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
      title="Add a recipe collection"
      description="The minimum a collection needs; everything else can be filled in afterwards."
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
import { computed, onMounted, ref } from 'vue'
import rcollectionsApi, { type RecipeCollection } from '~/services/rcollectionsApi'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Recipe Collections · Console' })

const toast = useToast()
const breadcrumbItems = assetSectionBreadcrumb('collections')

const pageSize = 20
const collections = ref<RecipeCollection[]>([])
const total = ref(0)
const page = ref(1)
const query = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const creating = ref(false)
const saving = ref(false)
const createError = ref<string | null>(null)
const draft = ref({ title: '', description: '', url: '', license: '' })

const countLabel = computed(() =>
  `${total.value.toLocaleString()} collection${total.value === 1 ? '' : 's'}`)

/*
 * Surfaced rather than buried: a collection with no licence recorded is not
 * one we know we may use, and counting them is the only way that stays
 * visible as the library grows.
 */
const undetermined = computed(() =>
  collections.value.filter(c => !c.license).length)

const rangeLabel = computed(() => {
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, total.value)
  return `${start}–${end} of ${total.value.toLocaleString()}`
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await rcollectionsApi.searchCollections({
      limit: pageSize,
      offset: (page.value - 1) * pageSize,
      q: query.value.trim() || undefined
    })
    collections.value = result.collections
    total.value = result.total
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
