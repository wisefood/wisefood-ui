<template>
  <div
    ref="viewportInnerEl"
    class="relative min-h-[36rem]"
  >
    <div
      v-if="loading || rendering"
      class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-zinc-950/70"
    >
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <UIcon
          name="i-lucide-loader-circle"
          class="h-4 w-4 animate-spin"
        />
        <span>{{ loading ? 'Loading document' : 'Rendering page' }}</span>
      </div>
    </div>

    <div
      v-if="error"
      class="flex min-h-[32rem] items-center justify-center px-6 text-center"
    >
      <div>
        <UIcon
          name="i-lucide-file-warning"
          class="mx-auto h-8 w-8 text-gray-400"
        />
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          {{ error }}
        </p>
        <UButton
          class="mt-4"
          color="neutral"
          variant="outline"
          size="sm"
          icon="i-lucide-refresh-cw"
          @click="reloadDocument"
        >
          Retry
        </UButton>
      </div>
    </div>

    <div
      v-else
      class="flex w-max min-w-full items-start justify-center gap-4 p-4"
    >
      <div
        v-for="panel in visiblePanels"
        :key="panel.key"
        class="shrink-0 space-y-2"
      >
        <div class="flex items-center justify-between gap-2 px-1">
          <div class="flex items-center gap-2">
            <UBadge
              :color="panel.kind === 'active' ? 'primary' : 'neutral'"
              :variant="panel.kind === 'active' ? 'soft' : 'outline'"
            >
              {{ panel.kind === 'active' ? 'Active page' : 'Context only' }}
            </UBadge>
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
              Page {{ panel.page }}
            </span>
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-white/10">
          <VuePdfEmbed
            v-if="pdfDocument"
            :key="buildPanelRenderKey(panel)"
            :source="pdfDocument"
            :page="panel.page"
            :width="resolvedPageWidth"
            annotation-layer
            class="block bg-white"
            @internal-link-clicked="emit('navigate-page', $event)"
            @rendered="handlePanelRendered(panel.key)"
            @loading-failed="handleDocumentLoadFailure"
            @rendering-failed="handlePanelRenderFailure"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VuePdfEmbed, { useVuePdfEmbed } from 'vue-pdf-embed'
import 'vue-pdf-embed/dist/styles/annotationLayer.css'
import type { CatalogArtifact } from '~/services/catalogApi'
import {
  fetchCatalogArtifactDownloadResponse,
  getArtifactPresignedUrl,
  hasS3Backing
} from '~/services/objectStorageApi'

type PdfPanelKey = 'primary' | 'secondary'
type PdfViewportStatus = {
  error: string | null
  loading: boolean
  rendering: boolean
  totalPages: number
}
type PdfDocumentSource = {
  data?: Uint8Array
  url?: string
}
type PdfEmbedSource = Uint8Array | { url: string }

const props = defineProps<{
  artifact: CatalogArtifact
  currentPage: number
  secondaryPage?: number | null
  zoom: number
  reloadToken?: number
}>()

const emit = defineEmits<{
  'navigate-page': [page: number]
  'status-change': [status: PdfViewportStatus]
}>()

const pdfByteCache: Record<string, Uint8Array> = {}
const pdfUrlCache: Record<string, string> = {}

const viewportInnerEl = ref<HTMLElement | null>(null)
const pdfSource = shallowRef<PdfEmbedSource | null>(null)
const totalPages = ref(0)
const loading = ref(true)
const rendering = ref(false)
const error = ref<string | null>(null)
const viewportWidth = ref(0)
const documentRenderSeed = ref(0)

const pendingPanelKeys = shallowRef<Set<PdfPanelKey>>(new Set())

let resizeObserver: ResizeObserver | null = null
let loadToken = 0

const { doc: pdfDocument } = useVuePdfEmbed({
  source: pdfSource,
  onError(loadError) {
    console.error('[GuideReviewPdfViewport] Failed to load PDF:', loadError)
    error.value = 'The selected PDF could not be opened.'
    totalPages.value = 0
    loading.value = false
    clearRenderState()
    emitStatusChange()
  }
})

const activePage = computed(() =>
  clampPage(props.currentPage, totalPages.value)
)

const contextPage = computed(() => {
  if (!props.secondaryPage || props.secondaryPage <= activePage.value || props.secondaryPage > totalPages.value) {
    return null
  }

  return clampPage(props.secondaryPage, totalPages.value)
})

const visiblePanels = computed(() => {
  const panels: Array<{ key: PdfPanelKey, kind: 'active' | 'context', page: number }> = [{
    key: 'primary',
    kind: 'active',
    page: activePage.value
  }]

  if (contextPage.value) {
    panels.push({
      key: 'secondary',
      kind: 'context',
      page: contextPage.value
    })
  }

  return panels
})

const resolvedPageWidth = computed(() => {
  const containerWidth = Math.max(viewportWidth.value - 32, 320)
  const interPageGap = visiblePanels.value.length > 1 ? 16 : 0
  const perPageWidth = visiblePanels.value.length > 1
    ? Math.max((containerWidth - interPageGap) / 2, 240)
    : containerWidth

  return Math.max(Math.floor(perPageWidth * props.zoom), 240)
})

const renderSignature = computed(() => {
  if (!pdfDocument.value || loading.value || error.value || !totalPages.value) {
    return ''
  }

  return `${documentRenderSeed.value}:${visiblePanels.value.map(panel => `${panel.key}:${panel.page}`).join('|')}:${resolvedPageWidth.value}`
})

function clampPage(page: number, pageTotal: number) {
  if (!pageTotal) {
    return 1
  }

  return Math.min(Math.max(page, 1), pageTotal)
}

function emitStatusChange() {
  emit('status-change', {
    error: error.value,
    loading: loading.value,
    rendering: rendering.value,
    totalPages: totalPages.value
  })
}

function clearRenderState() {
  pendingPanelKeys.value = new Set()
  rendering.value = false
}

function buildPanelRenderKey(panel: { key: PdfPanelKey, page: number }) {
  return `${documentRenderSeed.value}:${panel.key}:${panel.page}:${resolvedPageWidth.value}`
}

function handlePanelRendered(panelKey: PdfPanelKey) {
  if (!pendingPanelKeys.value.has(panelKey)) {
    return
  }

  const nextPendingPanels = new Set(pendingPanelKeys.value)
  nextPendingPanels.delete(panelKey)
  pendingPanelKeys.value = nextPendingPanels

  if (!pendingPanelKeys.value.size) {
    rendering.value = false
    emitStatusChange()
  }
}

function handleDocumentLoadFailure(loadError: unknown) {
  console.error('[GuideReviewPdfViewport] Failed to load PDF:', loadError)
  error.value = 'The selected PDF could not be opened.'
  totalPages.value = 0
  loading.value = false
  clearRenderState()
  emitStatusChange()
}

function handlePanelRenderFailure(renderError: unknown) {
  console.error('[GuideReviewPdfViewport] Failed to render PDF page:', renderError)
  error.value = 'The PDF page could not be rendered.'
  loading.value = false
  clearRenderState()
  emitStatusChange()
}

function syncViewportWidth() {
  const element = viewportInnerEl.value
  viewportWidth.value = element ? Math.floor(element.clientWidth) : 0
}

async function resolvePdfSource(artifact: CatalogArtifact, forceReload = false): Promise<PdfDocumentSource> {
  if (forceReload) {
    delete pdfByteCache[artifact.id]
    delete pdfUrlCache[artifact.id]
  }

  const cachedUrl = pdfUrlCache[artifact.id]
  if (cachedUrl) {
    return { url: cachedUrl }
  }

  const cachedBytes = pdfByteCache[artifact.id]
  if (cachedBytes?.byteLength) {
    return { data: cachedBytes }
  }

  if (hasS3Backing(artifact)) {
    try {
      const presignedUrl = await getArtifactPresignedUrl(artifact)
      pdfUrlCache[artifact.id] = presignedUrl
      return { url: presignedUrl }
    } catch (presignError) {
      console.warn('[GuideReviewPdfViewport] Falling back to direct artifact download after presign failure:', presignError)
    }
  }

  const response = await fetchCatalogArtifactDownloadResponse(artifact.id)
  if (!response.ok) {
    throw new Error(`PDF fetch failed with status ${response.status}`)
  }

  const data = new Uint8Array(await response.arrayBuffer())
  if (!data.byteLength) {
    throw new Error('The PDF response was empty')
  }

  pdfByteCache[artifact.id] = data
  return { data }
}

function startRenderCycle() {
  if (!pdfDocument.value || loading.value || error.value) {
    clearRenderState()
    emitStatusChange()
    return
  }

  pendingPanelKeys.value = new Set(visiblePanels.value.map(panel => panel.key))
  rendering.value = pendingPanelKeys.value.size > 0
  emitStatusChange()
}

async function loadDocument(forceReload = false) {
  const currentLoadToken = ++loadToken

  loading.value = true
  error.value = null
  totalPages.value = 0
  clearRenderState()
  pdfSource.value = null
  emitStatusChange()

  if (currentLoadToken !== loadToken) {
    return
  }

  try {
    const source = await resolvePdfSource(props.artifact, forceReload)
    if (currentLoadToken !== loadToken) {
      return
    }

    pdfSource.value = source.url ? { url: source.url } : source.data || null
  } catch (loadError) {
    if (currentLoadToken !== loadToken) {
      return
    }

    console.error('[GuideReviewPdfViewport] Failed to load PDF:', loadError)
    error.value = 'The selected PDF could not be opened.'
    totalPages.value = 0
    loading.value = false
    rendering.value = false
  } finally {
    if (currentLoadToken === loadToken) {
      emitStatusChange()
    }
  }
}

function reloadDocument() {
  void loadDocument(true)
}

onMounted(() => {
  syncViewportWidth()

  if (!viewportInnerEl.value || !import.meta.client) {
    return
  }

  resizeObserver = new ResizeObserver(() => {
    syncViewportWidth()
  })

  resizeObserver.observe(viewportInnerEl.value)
})

watch(
  () => props.artifact.id,
  () => {
    void loadDocument()
  },
  { immediate: true }
)

watch(
  () => props.reloadToken,
  (value, previousValue) => {
    if (value === previousValue) {
      return
    }

    void loadDocument(true)
  }
)

watch(pdfDocument, (document, previousDocument) => {
  if (!document || document === previousDocument) {
    return
  }

  totalPages.value = document.numPages || 0
  error.value = null
  loading.value = false
  documentRenderSeed.value += 1
  emitStatusChange()
})

watch(
  renderSignature,
  async (signature, previousSignature) => {
    if (!signature || signature === previousSignature) {
      return
    }

    await nextTick()
    startRenderCycle()
  },
  { flush: 'post' }
)

watch([loading, rendering, error, totalPages], () => {
  emitStatusChange()
}, {
  immediate: true
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  loadToken += 1
  pdfSource.value = null
})
</script>
