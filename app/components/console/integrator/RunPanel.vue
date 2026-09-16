<!--
  Integrating an approved proposal, and watching it happen.

  Approval and integration are two presses, not one. Approving says a person
  vouched for the source; integrating is when the catalog changes, and this is
  where they can see it change — the extraction behind a dietary guide reads a
  PDF page by page and takes minutes, so a button that blocked until it
  finished would look broken.

  A failed run is shown as prominently as a successful one, with what it
  managed to create before it stopped. That is the number somebody needs: a
  run that failed after creating the guide has left a guide behind.
-->
<template>
  <div class="space-y-3">
    <!-- Nothing has been tried yet. -->
    <div
      v-if="!run"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {{ pitch }}
      </p>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-eye"
          :loading="starting === 'preview'"
          :disabled="Boolean(starting)"
          @click="start(true)"
        >
          Preview
        </UButton>
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-download"
          :loading="starting === 'run'"
          :disabled="Boolean(starting)"
          @click="start(false)"
        >
          Integrate
        </UButton>
      </div>
    </div>

    <template v-else>
      <div
        class="rounded-xl px-3 py-2"
        :class="tone.box"
      >
        <div class="flex items-start gap-2">
          <UIcon
            :name="tone.icon"
            class="mt-0.5 h-4 w-4 shrink-0"
            :class="live ? 'animate-spin' : ''"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium">
              {{ headline }}
            </p>
            <p
              v-if="subline"
              class="mt-0.5 text-xs opacity-80"
            >
              {{ subline }}
            </p>
          </div>
          <span
            v-if="run.dry_run"
            class="shrink-0 text-[10px] uppercase tracking-wide opacity-70"
          >preview</span>
        </div>

        <!-- Only while a document is being read: it is the one stage with a
             real denominator, and a bar without one is decoration. -->
        <UProgress
          v-if="pages"
          class="mt-2"
          size="xs"
          :model-value="pages.current"
          :max="pages.total"
        />
      </div>

      <!-- What it created, once there is anything to name. -->
      <dl
        v-if="landed.length"
        class="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2"
      >
        <div
          v-for="item in landed"
          :key="item.label"
          class="flex items-baseline justify-between gap-2"
        >
          <dt class="shrink-0 text-gray-500 dark:text-gray-400">
            {{ item.label }}
          </dt>
          <dd class="min-w-0 truncate font-mono text-[11px] text-gray-700 dark:text-gray-200">
            {{ item.value }}
          </dd>
        </div>
      </dl>

      <ConsoleIntegratorStepTimeline
        :steps="run.steps"
        :running="live"
      />

      <div class="flex flex-wrap items-center justify-end gap-2">
        <UButton
          v-if="canRetry"
          color="neutral"
          variant="soft"
          size="sm"
          icon="i-lucide-rotate-ccw"
          :loading="starting === 'run'"
          @click="start(false)"
        >
          {{ run.wrote_anything ? 'Carry on from here' : 'Try again' }}
        </UButton>
        <UButton
          v-if="canRun"
          color="primary"
          size="sm"
          icon="i-lucide-download"
          :loading="starting === 'run'"
          @click="start(false)"
        >
          Integrate for real
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import integratorApi, {
  failureText, runIsLive, type IntegrationRun, type Proposal
} from '~/services/integratorApi'

const props = defineProps<{ proposal: Proposal }>()
const emit = defineEmits<{ finished: [IntegrationRun] }>()

const toast = useToast()

const run = ref<IntegrationRun | null>(null)
const starting = ref<'run' | 'preview' | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const live = computed(() => runIsLive(run.value))

/*
 * A run whose pod went away reads `stalled`. It is offered a retry rather
 * than left spinning, because the alternative is a curator watching a
 * progress line that will never move again.
 */
const canRetry = computed(() =>
  run.value?.status === 'failed' || run.value?.status === 'stalled')

/** A successful preview is the moment to offer the real thing. */
const canRun = computed(() =>
  run.value?.status === 'succeeded' && run.value.dry_run)

const PITCHES: Record<string, string> = {
  guide: 'Create the guide, attach the source PDF, extract its guidelines and import them — with every step recorded against this proposal.',
  article: 'Create the article from the publisher\'s own Crossref record, then enrich it — keywords, study type, glossary and Q&A.'
}
const pitch = computed(() =>
  PITCHES[props.proposal.kind]
  ?? 'Create the catalog entry from this proposal, with its provenance and licence attached.')

const STAGES: Record<string, string> = {
  queued: 'Queued',
  preflight: 'Checking it can run',
  create: 'Creating the catalog entry',
  upload: 'Attaching the source file',
  extract: 'Queuing the extraction',
  extracting: 'Reading the document',
  preview: 'Working out what is new',
  import: 'Importing the guidelines',
  enrich: 'Queuing the enrichment',
  enriching: 'Enriching the article',
  done: 'Done'
}

const headline = computed(() => {
  const current = run.value
  if (!current) return ''
  switch (current.status) {
    case 'succeeded':
      return current.dry_run ? 'Preview finished — nothing was written' : 'Integrated'
    case 'failed': return 'Integration stopped'
    case 'stalled': return 'This run stopped reporting'
    default: return STAGES[current.stage || ''] || 'Working'
  }
})

const subline = computed(() => {
  const current = run.value
  if (!current) return ''
  if (current.status === 'failed') return current.error || ''
  if (current.status === 'stalled') {
    return current.wrote_anything
      ? 'Whatever it created is listed below and is still there. Carrying on will reuse it rather than make a second copy.'
      : 'Nothing was written. It is safe to try again.'
  }
  if (current.status === 'succeeded' && current.dry_run) {
    const would = current.result.preview?.would_create
    return would != null ? `${would} guideline${would === 1 ? '' : 's'} would be created.` : ''
  }
  if (pages.value) return `Page ${pages.value.current} of ${pages.value.total}.`
  return ''
})

const pages = computed(() => {
  const extraction = run.value?.result?.extraction
  if (!extraction?.current_page || !extraction?.total_pages) return null
  return { current: extraction.current_page, total: extraction.total_pages }
})

const landed = computed(() => {
  const result = run.value?.result ?? {}
  const rows: { label: string, value: string }[] = []
  if (result.urn) rows.push({ label: 'Catalog entry', value: result.urn })
  if (result.artifact_id) rows.push({ label: 'Artifact', value: result.artifact_id })
  if (result.guidelines_extracted != null) {
    rows.push({ label: 'Guidelines found', value: String(result.guidelines_extracted) })
  }
  if (result.guidelines_created != null) {
    rows.push({ label: 'Guidelines imported', value: String(result.guidelines_created) })
  }
  if (result.enrichment?.wrote?.length) {
    rows.push({ label: 'Enriched', value: result.enrichment.wrote.join(', ') })
  }
  return rows
})

const tone = computed(() => {
  switch (run.value?.status) {
    case 'succeeded':
      return {
        icon: 'i-lucide-check-circle-2',
        box: 'bg-green-50 text-green-900 dark:bg-green-500/10 dark:text-green-200'
      }
    case 'failed':
      return {
        icon: 'i-lucide-alert-circle',
        box: 'bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200'
      }
    case 'stalled':
      return {
        icon: 'i-lucide-plug-zap',
        box: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200'
      }
    default:
      return {
        icon: 'i-lucide-loader-2',
        box: 'bg-brand-50 text-brand-900 dark:bg-brand-500/10 dark:text-brand-200'
      }
  }
})

async function start(dryRun: boolean) {
  starting.value = dryRun ? 'preview' : 'run'
  try {
    run.value = await integratorApi.integrate(props.proposal.id, dryRun)
    schedule()
  } catch (error) {
    toast.add({
      title: failureText(error, 'Could not start the integration'),
      color: 'error', icon: 'i-lucide-alert-circle'
    })
  } finally {
    starting.value = null
  }
}

/*
 * Five seconds: fast enough that the page counter moves while somebody is
 * looking, slow enough that an hour-long extraction is not hundreds of
 * requests. The timer is chained rather than an interval so a slow response
 * cannot stack up behind itself.
 */
function schedule() {
  stop()
  if (!live.value) return
  timer = setTimeout(poll, 5000)
}

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}

async function poll() {
  const id = run.value?.id
  if (!id) return
  const fresh = await integratorApi.run(id)
  if (fresh) {
    const was = run.value?.status
    run.value = fresh
    if (was !== fresh.status && !runIsLive(fresh)) emit('finished', fresh)
  }
  schedule()
}

onMounted(async () => {
  // The last attempt, so reopening the console shows a run that is still
  // going rather than an Integrate button that would refuse.
  const history = await integratorApi.runs(props.proposal.id)
  run.value = history[0] ?? null
  schedule()
})

onBeforeUnmount(stop)
</script>
