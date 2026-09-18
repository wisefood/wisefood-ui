<!--
  Import a whole recipe source.

  This screen exists because the alternative was a script. Nine of them live
  in RecipeWrangler, one per source, each hand-rolling selectors for one
  site's markup — so adding a source was a week's work and nobody without a
  checkout could do it at all.

  It opens on a dry run deliberately. Reading a source costs fetches; writing
  it costs a profiling run per recipe and is much harder to undo, and the
  preview answers the only question that decides whether a source is
  importable at all: how many of its pages actually publish the markup.
-->
<template>
  <UPage class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <UBreadcrumb
      :items="breadcrumbItems"
      class="mb-4"
    />

    <UPageHeader
      title="Import a source"
      description="Point at a sitemap or feed. Every page publishing schema.org Recipe goes through the same profiling chain as a recipe imported by URL."
      class="py-6"
      :ui="{ root: 'relative border-b-0' }"
    />

    <UPageBody class="space-y-6">
      <UCard :ui="{ body: 'p-5 sm:p-6' }">
        <form
          class="space-y-4"
          @submit.prevent="start"
        >
          <UFormField
            label="Sitemap, feed or URL list"
            required
            hint="sitemap.xml, a sitemap index, RSS/Atom, or a plain list"
          >
            <UInput
              v-model="form.location"
              class="w-full font-mono text-xs"
              placeholder="https://example.org/sitemap.xml"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Keep only URLs matching"
              hint="Usually what turns a whole sitemap into a recipe import"
            >
              <UInput
                v-model="form.include"
                class="w-full font-mono text-xs"
                placeholder="/recipes/"
              />
            </UFormField>
            <UFormField label="Registry source">
              <USelectMenu
                v-model="form.source_slug"
                value-key="value"
                :items="sourceOptions"
                class="w-full"
                placeholder="Not linked to one"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <UFormField
              label="Nutrition region"
              hint="Which food table profiles these"
            >
              <USelectMenu
                v-model="form.region"
                value-key="value"
                :items="REGIONS"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Most pages"
              hint="A ceiling on this run"
            >
              <UInput
                v-model.number="form.limit"
                type="number"
                class="w-full"
                min="1"
                max="5000"
              />
            </UFormField>
            <UFormField
              label="Seconds between pages"
              hint="A source is usually small hosting"
            >
              <UInput
                v-model.number="form.delay"
                type="number"
                class="w-full"
                min="0"
                max="30"
                step="0.5"
              />
            </UFormField>
          </div>

          <div class="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
            <UCheckbox
              v-model="form.respect_robots"
              label="Honour robots.txt"
              :description="form.respect_robots
                ? 'Pages the site asks crawlers to leave alone are skipped.'
                : 'Only turn this off for a source you run or have written permission from — and it is recorded against the run.'"
            />
            <UCheckbox
              v-model="form.dry_run"
              label="Preview only — read the pages, write nothing"
              description="Start here. It reports how many of the source's pages carry usable markup, which is what decides whether importing it is worth doing."
            />
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="error"
          />

          <div class="flex justify-end gap-2">
            <UButton
              :color="form.dry_run ? 'neutral' : 'primary'"
              :variant="form.dry_run ? 'solid' : 'solid'"
              :icon="form.dry_run ? 'i-lucide-eye' : 'i-lucide-download'"
              class="cursor-pointer"
              :loading="starting"
              :disabled="!form.location.trim()"
              @click="start"
            >
              {{ form.dry_run ? 'Preview source' : 'Import for real' }}
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- The run in flight, or the last one. -->
      <UCard
        v-if="run"
        :ui="{ body: 'p-5 sm:p-6' }"
        class="border"
        :class="tone.border"
      >
        <template #header>
          <div class="flex items-start gap-2">
            <UIcon
              :name="tone.icon"
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="[tone.text, live ? 'animate-spin' : '']"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ headline }}
              </p>
              <p class="mt-0.5 truncate font-mono text-[0.6875rem] text-gray-400 dark:text-gray-500">
                {{ run.location }}
              </p>
            </div>
            <UBadge
              v-if="run.dry_run"
              color="neutral"
              variant="soft"
              size="sm"
            >
              preview
            </UBadge>
          </div>
        </template>

        <UProgress
          v-if="run.discovered"
          class="mb-4"
          size="xs"
          :model-value="run.attempted"
          :max="run.discovered"
        />

        <dl class="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div
            v-for="stat in stats"
            :key="stat.label"
          >
            <dt class="text-xs text-gray-500 dark:text-gray-400">
              {{ stat.label }}
            </dt>
            <dd
              class="mt-0.5 text-lg font-semibold tabular-nums"
              :class="stat.class || 'text-gray-900 dark:text-white'"
            >
              {{ stat.value.toLocaleString() }}
            </dd>
          </div>
        </dl>

        <UAlert
          v-if="run.error"
          class="mt-4"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :description="run.error"
        />

        <!-- Why pages failed, grouped. A source where every page is missing
             instructions is a source with a markup problem, not a bad run. -->
        <div
          v-if="reasons.length"
          class="mt-4"
        >
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Why pages did not import
          </p>
          <ul class="space-y-1">
            <li
              v-for="reason in reasons"
              :key="reason.label"
              class="flex items-baseline justify-between gap-3 text-sm"
            >
              <span class="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-300">{{ reason.label }}</span>
              <span class="shrink-0 tabular-nums text-gray-400 dark:text-gray-500">{{ reason.count }}</span>
            </li>
          </ul>
        </div>

        <div
          v-if="run.detail.samples?.length"
          class="mt-4"
        >
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            What it read
          </p>
          <ul class="space-y-1">
            <li
              v-for="sample in run.detail.samples"
              :key="sample.url"
              class="flex items-baseline justify-between gap-3 text-sm"
            >
              <span class="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">{{ sample.title }}</span>
              <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {{ sample.ingredients }} ingredients
              </span>
            </li>
          </ul>
        </div>

        <div
          v-if="canPromote"
          class="mt-5 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 dark:bg-zinc-900/60"
        >
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ run.imported.toLocaleString() }} pages parsed cleanly. Run it again to
            profile and store them.
          </p>
          <UButton
            color="primary"
            size="sm"
            icon="i-lucide-download"
            class="shrink-0 cursor-pointer"
            :loading="starting"
            @click="promote"
          >
            Import for real
          </UButton>
        </div>
      </UCard>

      <UCard
        v-if="history.length"
        :ui="{ body: 'p-0', header: 'p-5 sm:p-6' }"
      >
        <template #header>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            Recent imports
          </h2>
        </template>
        <div class="divide-y divide-gray-100 dark:divide-white/5">
          <button
            v-for="entry in history"
            :key="entry.id"
            type="button"
            class="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-gray-50 sm:px-6 dark:hover:bg-white/5"
            @click="open(entry)"
          >
            <UBadge
              size="sm"
              variant="soft"
              :color="entry.status === 'succeeded' ? 'success' : entry.status === 'failed' ? 'error' : 'neutral'"
            >
              {{ entry.status }}
            </UBadge>
            <span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {{ entry.location }}
            </span>
            <span class="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">
              {{ entry.imported }} / {{ entry.discovered }}
            </span>
          </button>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import sourceImportApi, {
  runIsLive, type RegisteredSource, type SourceImportRun
} from '~/services/sourceImportApi'
import { assetSectionBreadcrumb } from '~/utils/consoleBreadcrumbs'

definePageMeta({ layout: 'default' })
useHead({ title: 'Import a source · Console' })

const toast = useToast()
const breadcrumbItems = assetSectionBreadcrumb(
  'collections', [{ label: 'Import a source', icon: 'i-lucide-download' }])

const REGIONS = [
  { label: 'Ireland', value: 'IE' },
  { label: 'Hungary', value: 'HU' },
  { label: 'Slovenia', value: 'SI' },
  { label: 'EU', value: 'EU' }
]

const form = reactive({
  location: '',
  include: '',
  source_slug: '',
  region: 'IE',
  limit: 200,
  delay: 1,
  respect_robots: true,
  dry_run: true
})

const starting = ref(false)
const error = ref('')
const run = ref<SourceImportRun | null>(null)
const history = ref<SourceImportRun[]>([])
const sources = ref<RegisteredSource[]>([])
let timer: ReturnType<typeof setTimeout> | null = null

const live = computed(() => runIsLive(run.value))

const sourceOptions = computed(() => [
  { label: 'Not linked to one', value: '' },
  ...sources.value
    .filter(s => !s.retired)
    .map(s => ({ label: s.display_name, value: s.slug }))
])

const headline = computed(() => {
  const current = run.value
  if (!current) return ''
  switch (current.status) {
    case 'succeeded':
      return current.dry_run ? 'Preview finished — nothing was written' : 'Import finished'
    case 'failed': return 'Import stopped'
    case 'stalled': return 'This run stopped reporting'
    default: return current.stage === 'discovering'
      ? 'Finding the pages…'
      : `Reading page ${current.attempted} of ${current.discovered}`
  }
})

const stats = computed(() => {
  const r = run.value
  if (!r) return []
  return [
    { label: 'Found', value: r.discovered },
    { label: 'Read', value: r.attempted },
    { label: r.dry_run ? 'Parsed' : 'Imported', value: r.imported, class: 'text-green-600 dark:text-green-400' },
    { label: 'Failed', value: r.failed, class: r.failed ? 'text-red-600 dark:text-red-400' : undefined },
    { label: 'Skipped', value: r.skipped }
  ]
})

const reasons = computed(() =>
  Object.entries(run.value?.detail?.reasons ?? {})
    .map(([label, count]) => ({ label, count })))

/** A clean preview is the moment to offer the real thing. */
const canPromote = computed(() =>
  run.value?.status === 'succeeded' && run.value.dry_run && run.value.imported > 0)

const tone = computed(() => {
  switch (run.value?.status) {
    case 'succeeded':
      return { icon: 'i-lucide-check-circle-2', text: 'text-green-500', border: 'border-green-200 dark:border-green-500/30' }
    case 'failed':
      return { icon: 'i-lucide-alert-circle', text: 'text-red-500', border: 'border-red-200 dark:border-red-500/30' }
    case 'stalled':
      return { icon: 'i-lucide-plug-zap', text: 'text-amber-500', border: 'border-amber-200 dark:border-amber-500/30' }
    default:
      return { icon: 'i-lucide-loader-2', text: 'text-brand-500', border: 'border-gray-200/70 dark:border-white/10' }
  }
})

async function start() {
  if (!form.location.trim()) return
  starting.value = true
  error.value = ''
  try {
    run.value = await sourceImportApi.start({
      location: form.location.trim(),
      include: form.include.trim() || undefined,
      source_slug: form.source_slug || undefined,
      region: form.region,
      limit: form.limit,
      delay: form.delay,
      respect_robots: form.respect_robots,
      dry_run: form.dry_run
    })
    schedule()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not start that import.'
  } finally {
    starting.value = false
  }
}

async function promote() {
  form.dry_run = false
  await start()
}

function open(entry: SourceImportRun) {
  run.value = entry
  form.location = entry.location
  schedule()
}

/*
 * Chained rather than an interval, so a slow response cannot stack up behind
 * itself. Five seconds: a single recipe takes seconds to profile, so anything
 * faster is just load.
 */
function schedule() {
  stop()
  if (!live.value) {
    void refreshHistory()
    return
  }
  timer = setTimeout(poll, 5000)
}

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

async function poll() {
  const id = run.value?.id
  if (!id) return
  const fresh = await sourceImportApi.run(id)
  if (fresh) {
    const was = run.value?.status
    run.value = fresh
    if (was !== fresh.status && !runIsLive(fresh)) {
      toast.add({
        title: fresh.status === 'succeeded'
          ? (fresh.dry_run ? 'Preview finished' : 'Import finished')
          : 'Import stopped',
        color: fresh.status === 'succeeded' ? 'success' : 'error',
        icon: fresh.status === 'succeeded' ? 'i-lucide-check' : 'i-lucide-alert-circle'
      })
    }
  }
  schedule()
}

async function refreshHistory() {
  history.value = await sourceImportApi.runs(10)
}

onMounted(async () => {
  const [registry] = await Promise.all([sourceImportApi.sources(), refreshHistory()])
  sources.value = registry.sources
  // Pick up a run that is still going, so reopening the page shows it.
  const running = history.value.find(runIsLive)
  if (running) {
    run.value = running
    schedule()
  }
})

onBeforeUnmount(stop)
</script>
