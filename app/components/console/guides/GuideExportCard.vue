<template>
  <UCard
    :ui="{ body: 'p-5 sm:p-6', header: 'p-5 sm:px-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            Excel export
          </h3>
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Every rule of this guide in the FSKG statements layout, built in the background.
          </p>
        </div>
        <UBadge
          v-if="status && status.status !== 'not_found'"
          :color="statusColor"
          variant="subtle"
          class="gap-1"
        >
          <UIcon
            v-if="isLive"
            name="i-lucide-loader-circle"
            class="h-3 w-3 animate-spin"
          />
          {{ statusLabel }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
      />

      <UAlert
        v-else-if="status?.status === 'stalled'"
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="The worker handling this export stopped. Export again to restart it."
      />

      <p class="text-xs leading-5 text-gray-600 dark:text-gray-400">
        The workbook has the Statements, Sample Relations and README sheets of the FSKG
        statements workbook, plus every platform field of every rule and the guide record.
        Draft and unreviewed rules are included. A finished export can be downloaded for
        24 hours.
      </p>

      <div class="flex flex-wrap gap-2">
        <UButton
          size="sm"
          color="primary"
          variant="soft"
          icon="i-lucide-file-spreadsheet"
          :loading="enqueuePending || isLive"
          :disabled="enqueuePending || isLive || downloadPending"
          @click="startExport"
        >
          {{ hasExported ? 'Export again' : 'Export to Excel' }}
        </UButton>

        <UButton
          v-if="status?.download_ready"
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          :loading="downloadPending"
          :disabled="isLive"
          @click="download"
        >
          Download
          <span
            v-if="status.filename"
            class="max-w-[16rem] truncate font-mono text-[0.6875rem]"
          >{{ status.filename }}</span>
        </UButton>
      </div>

      <dl
        v-if="tiles.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div
          v-for="tile in tiles"
          :key="tile.label"
        >
          <dt class="text-[0.6875rem] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </dt>
          <dd class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
            {{ tile.value }}
          </dd>
        </div>
      </dl>
    </div>
  </UCard>
</template>

<script setup lang="ts">
/**
 * Console-only Excel export of a guide's guidelines.
 *
 * The workbook is built by a FoodScholar background job; this card queues it,
 * polls while it runs, and downloads the result. On mount it picks up the
 * guide's latest export, so a reload mid-run keeps following it and a
 * finished export stays one click away until it expires.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import foodscholarGuidelinesApi, { type FoodScholarGuideExportStatus } from '~/services/foodscholarGuidelinesApi'
import { apiErrorMessage } from '~/utils/apiErrorMessage'
import { formatConsoleBytes } from '~/utils/consoleGuideCatalog'

const props = defineProps<{
  guideUrn: string
}>()

const POLL_INTERVAL_MS = 3000

const toast = useToast()

const status = ref<FoodScholarGuideExportStatus | null>(null)
const enqueuePending = ref(false)
const downloadPending = ref(false)
const errorMessage = ref<string | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null

const isLive = computed(() => status.value?.status === 'queued' || status.value?.status === 'running')
const hasExported = computed(() => Boolean(status.value && status.value.status !== 'not_found'))

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  fetching: 'Reading rules',
  writing: 'Writing workbook'
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  failed: 'Failed',
  stalled: 'Stalled'
}

const statusLabel = computed(() => {
  const current = status.value
  if (!current) return ''
  if (current.status === 'running') return STAGE_LABELS[current.stage || ''] || 'Running'
  if (current.status === 'succeeded') return current.download_ready ? 'Ready' : 'Expired'
  return STATUS_LABELS[current.status] || current.status
})

const statusColor = computed(() => {
  const current = status.value?.status
  if (current === 'succeeded') return status.value?.download_ready ? 'success' : 'neutral'
  if (current === 'failed') return 'error'
  if (current === 'stalled') return 'warning'
  if (current === 'queued' || current === 'running') return 'info'
  return 'neutral'
})

/** Date and time: the download window is 24 hours, so the day alone says too little. */
function formatWhen(value: string | null | undefined) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

const tiles = computed(() => {
  const current = status.value
  if (!current || current.status === 'not_found') return []
  const rows = current.total_guidelines
  return [
    { label: 'Rules', value: typeof rows === 'number' ? rows.toLocaleString() : '—' },
    { label: 'Size', value: current.size_bytes ? formatConsoleBytes(current.size_bytes) : '—' },
    { label: 'Finished', value: formatWhen(current.completed_at) },
    {
      label: current.download_ready ? 'Available until' : 'Requested',
      value: formatWhen(current.download_ready ? current.expires_at : current.enqueued_at)
    }
  ]
})

function clearPoll() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function schedulePoll() {
  clearPoll()
  if (isLive.value) {
    pollTimer = setTimeout(() => {
      void refresh()
    }, POLL_INTERVAL_MS)
  }
}

function announce(previous: FoodScholarGuideExportStatus | null, next: FoodScholarGuideExportStatus) {
  const wasLive = previous?.status === 'queued' || previous?.status === 'running'
  if (!wasLive || previous?.job_id !== next.job_id) return
  if (next.status === 'succeeded') {
    toast.add({
      title: 'Excel export ready',
      description: `${(next.total_guidelines ?? 0).toLocaleString()} rules exported.`,
      color: 'success',
      icon: 'i-lucide-file-spreadsheet'
    })
  } else if (next.status === 'failed') {
    toast.add({
      title: 'Excel export failed',
      description: next.error || undefined,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

async function refresh() {
  try {
    const next = await foodscholarGuidelinesApi.getGuideExportStatus(props.guideUrn)
    announce(status.value, next)
    status.value = next
    errorMessage.value = next.status === 'failed' ? next.error || 'The export failed.' : null
  } catch (caught) {
    errorMessage.value = apiErrorMessage(caught, 'Could not read the export status.')
  } finally {
    schedulePoll()
  }
}

async function startExport() {
  enqueuePending.value = true
  errorMessage.value = null
  try {
    // A stalled job's worker is gone, so it is replaced rather than awaited.
    status.value = await foodscholarGuidelinesApi.enqueueGuideExport(props.guideUrn, {
      force: status.value?.status === 'stalled'
    })
    schedulePoll()
  } catch (caught) {
    errorMessage.value = apiErrorMessage(caught, 'Could not queue the export.')
  } finally {
    enqueuePending.value = false
  }
}

async function download() {
  downloadPending.value = true
  errorMessage.value = null
  try {
    const { blob, filename } = await foodscholarGuidelinesApi.downloadGuideExport(props.guideUrn)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (caught) {
    errorMessage.value = apiErrorMessage(caught, 'Could not download the workbook.')
    // A 404 here means it expired since the last poll; show that state.
    void refresh()
  } finally {
    downloadPending.value = false
  }
}

onMounted(() => {
  void refresh()
})

watch(() => props.guideUrn, () => {
  clearPoll()
  status.value = null
  errorMessage.value = null
  void refresh()
})

onBeforeUnmount(clearPoll)
</script>
