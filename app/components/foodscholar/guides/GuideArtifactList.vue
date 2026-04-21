<template>
  <UCard
    :ui="{ body: 'p-5 sm:p-6' }"
    class="border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <div class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Artifacts
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Source files and downloadable guide publications attached to this record.
          </p>
        </div>

        <UBadge
          color="neutral"
          variant="outline"
        >
          {{ artifacts.length }} item{{ artifacts.length === 1 ? '' : 's' }}
        </UBadge>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
      />

      <div v-if="artifacts.length" class="space-y-3">
        <div
          v-for="artifact in artifacts"
          :key="artifact.id"
          class="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-start md:justify-between"
        >
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :color="isPdfArtifact(artifact) ? 'primary' : 'neutral'"
                variant="soft"
              >
                {{ getArtifactTypeLabel(artifact) }}
              </UBadge>
              <UBadge
                v-if="artifact.language"
                color="neutral"
                variant="outline"
              >
                {{ artifact.language.toUpperCase() }}
              </UBadge>
            </div>

            <div>
              <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {{ artifact.title }}
              </h3>
              <p v-if="artifact.description" class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {{ artifact.description }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ formatBytes(artifact.file_size) }}</span>
              <span v-if="artifact.updated_at">{{ formatCatalogDate(artifact.updated_at) }}</span>
              <span v-else-if="artifact.created_at">{{ formatCatalogDate(artifact.created_at) }}</span>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-external-link"
              :loading="openingArtifactId === artifact.id"
              @click="openArtifact(artifact)"
            >
              Open
            </UButton>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-download"
              :loading="downloadingArtifactId === artifact.id"
              @click="downloadArtifact(artifact)"
            >
              Download
            </UButton>
          </div>
        </div>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-gray-300/80 bg-gray-50/70 px-5 py-10 text-center dark:border-white/15 dark:bg-white/5">
        <UIcon
          name="i-lucide-folder-open"
          class="mx-auto h-8 w-8 text-gray-400"
        />
        <p class="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          No artifacts are available for this guide yet.
        </p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Metadata can still be explored even when no PDF or source files have been attached.
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { CatalogArtifact } from '~/services/catalogApi'
import {
  fetchCatalogArtifactDownloadResponse,
  getArtifactPresignedUrl,
  hasS3Backing
} from '~/services/objectStorageApi'
import {
  formatBytes,
  formatCatalogDate,
  getArtifactTypeLabel,
  isPdfArtifact
} from '~/utils/guidesCatalog'

defineProps<{
  artifacts: CatalogArtifact[]
}>()

const openingArtifactId = ref('')
const downloadingArtifactId = ref('')
const errorMessage = ref<string | null>(null)

function extractFilenameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i)
  return plainMatch?.[1] || null
}

function extensionFromMimeType(mimeType: string) {
  const known: Record<string, string> = {
    'application/json': 'json',
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt'
  }

  return known[mimeType] || ''
}

function sanitizeFilename(filename: string) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .split('')
    .filter(character => character >= ' ')
    .join('')
}

function buildArtifactFilename(artifact: CatalogArtifact, response: Response) {
  const fromHeader = extractFilenameFromDisposition(response.headers.get('content-disposition'))
  if (fromHeader) {
    return sanitizeFilename(fromHeader)
  }

  const baseName = sanitizeFilename(artifact.title || `artifact-${artifact.id}`)
  const mimeType = (response.headers.get('content-type') || artifact.file_type).split(';')[0]?.trim() || ''
  const extension = extensionFromMimeType(mimeType)

  if (extension && !baseName.toLowerCase().endsWith(`.${extension}`)) {
    return `${baseName}.${extension}`
  }

  return baseName
}

async function fetchArtifactResponse(artifact: CatalogArtifact) {
  if (hasS3Backing(artifact)) {
    try {
      const url = await getArtifactPresignedUrl(artifact)
      return await fetch(url)
    } catch {
      return fetchCatalogArtifactDownloadResponse(artifact.id)
    }
  }

  return fetchCatalogArtifactDownloadResponse(artifact.id)
}

async function openArtifact(artifact: CatalogArtifact) {
  const popup = window.open('', '_blank', 'noopener,noreferrer')
  openingArtifactId.value = artifact.id
  errorMessage.value = null

  try {
    if (hasS3Backing(artifact)) {
      const url = await getArtifactPresignedUrl(artifact)
      if (popup) {
        popup.location.href = url
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      return
    }

    const response = await fetchCatalogArtifactDownloadResponse(artifact.id)
    if (!response.ok) {
      throw new Error(`Open failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    if (popup) {
      popup.location.href = objectUrl
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 60_000)
  } catch (error) {
    popup?.close()
    console.error('[GuideArtifactList] Failed to open artifact:', error)
    errorMessage.value = 'The selected artifact could not be opened right now.'
  } finally {
    openingArtifactId.value = ''
  }
}

async function downloadArtifact(artifact: CatalogArtifact) {
  downloadingArtifactId.value = artifact.id
  errorMessage.value = null

  try {
    const response = await fetchArtifactResponse(artifact)
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = buildArtifactFilename(artifact, response)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('[GuideArtifactList] Failed to download artifact:', error)
    errorMessage.value = 'The selected artifact could not be downloaded right now.'
  } finally {
    downloadingArtifactId.value = ''
  }
}
</script>
