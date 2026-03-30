import type { CatalogArtifact } from './catalogApi'
import wisefoodApi from './wisefoodApi'
import { useAuthStore } from '~/stores/auth'
import { getWisefoodApiUrl } from '~/utils/runtimeConfig'

type UnknownRecord = Record<string, unknown>

export interface ArtifactUploadPayload {
  parentUrn: string
  file: File
  title?: string | null
  description?: string | null
  fileType?: string | null
  language?: string | null
}

interface PresignedArtifactUrlOptions {
  disposition?: 'inline' | 'attachment'
  expiresInSeconds?: number
  filename?: string
  responseContentType?: string
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as UnknownRecord
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function unwrapArtifactEntity(value: unknown): unknown {
  let current = value
  let changed = true

  while (changed) {
    changed = false
    const record = asRecord(current)

    if (!record) {
      return current
    }

    for (const key of ['artifact', 'item', 'result', 'data']) {
      if (record[key] !== undefined) {
        current = record[key]
        changed = true
        break
      }
    }
  }

  return current
}

function normalizeArtifact(value: unknown): CatalogArtifact {
  const record = asRecord(value) || {}

  return {
    id: asString(record['id']) || '',
    parent_urn: asString(record['parent_urn']) || '',
    title: asString(record['title']) || 'Untitled artifact',
    description: asString(record['description']),
    creator: asString(record['creator']),
    created_at: asString(record['created_at']),
    updated_at: asString(record['updated_at']),
    file_url: asString(record['file_url']) || '',
    file_s3_url: asString(record['file_s3_url']),
    file_type: asString(record['file_type']) || 'application/octet-stream',
    file_size: asNumber(record['file_size']),
    language: asString(record['language'])
  }
}

async function parseApiError(response: Response) {
  try {
    const payload = await response.json()
    const detail = asRecord(payload)?.['detail']

    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map(item => {
          const record = asRecord(item)
          return typeof record?.['msg'] === 'string' ? record['msg'] : null
        })
        .filter((item): item is string => Boolean(item))

      if (messages.length) {
        return messages.join(' ')
      }
    }

    return `API request failed with status ${response.status}`
  } catch {
    const payload = await response.text()
    return payload.trim() || `API request failed with status ${response.status}`
  }
}

async function parseJsonPayload(response: Response) {
  const contentType = response.headers.get('content-type')

  if (!contentType || !contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

function extractPresignedUrl(payload: unknown) {
  const root = asRecord(payload)

  const directUrl = asString(root?.['url'])
    || asString(root?.['presigned_url'])
    || asString(root?.['presignedUrl'])

  if (directUrl) {
    return directUrl
  }

  const result = asRecord(root?.['result'])
  const nestedUrl = asString(result?.['url'])
    || asString(result?.['presigned_url'])
    || asString(result?.['presignedUrl'])

  if (nestedUrl) {
    return nestedUrl
  }

  throw new Error('Presigned artifact URL missing from response')
}

export function hasS3Backing(artifact: Pick<CatalogArtifact, 'file_s3_url'> | null | undefined) {
  return Boolean(artifact?.file_s3_url)
}

export async function getArtifactPresignedUrl(
  artifact: Pick<CatalogArtifact, 'id' | 'file_s3_url'>,
  _options: PresignedArtifactUrlOptions = {}
) {
  if (!artifact.id) {
    throw new Error('Artifact identifier is required to request a presigned URL')
  }

  if (!artifact.file_s3_url) {
    throw new Error('Artifact does not have an object storage reference')
  }

  const payload = await wisefoodApi.get<unknown>(`/v1/artifacts/${encodeURIComponent(artifact.id)}/presign`)
  return extractPresignedUrl(payload)
}

async function ensureAccessToken() {
  const authStore = useAuthStore()
  let token = authStore.getToken()

  if (!token) {
    const refreshed = await authStore.refreshToken()
    token = refreshed ? authStore.getToken() : null
  }

  if (!token) {
    throw new Error('No authentication token available')
  }

  return token
}

async function fetchArtifactResponse(artifactId: string, token: string) {
  return fetch(`${getWisefoodApiUrl()}/v1/artifacts/${encodeURIComponent(artifactId)}/download`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

export async function fetchCatalogArtifactDownloadResponse(artifactId: string) {
  const authStore = useAuthStore()
  let token = await ensureAccessToken()
  let response = await fetchArtifactResponse(artifactId, token)

  if (response.status === 401) {
    const refreshed = await authStore.refreshToken()
    token = refreshed ? authStore.getToken() || '' : ''

    if (!token) {
      throw new Error('Authentication expired')
    }

    response = await fetchArtifactResponse(artifactId, token)
  }

  return response
}

async function uploadArtifactRequest(formData: FormData, token: string) {
  return fetch(`${getWisefoodApiUrl()}/v1/artifacts/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  })
}

function buildArtifactUploadFormData(payload: ArtifactUploadPayload, includeFileType = true) {
  const formData = new FormData()

  formData.append('file', payload.file)
  formData.append('parent_urn', payload.parentUrn)

  if (payload.title?.trim()) {
    formData.append('title', payload.title.trim())
  }

  if (payload.description?.trim()) {
    formData.append('description', payload.description.trim())
  }

  if (includeFileType && payload.fileType?.trim()) {
    formData.append('file_type', payload.fileType.trim())
  }

  if (payload.language?.trim()) {
    formData.append('language', payload.language.trim())
  }

  return formData
}

export async function uploadCatalogArtifact(payload: ArtifactUploadPayload): Promise<CatalogArtifact> {
  const authStore = useAuthStore()
  let token = await ensureAccessToken()
  const formData = buildArtifactUploadFormData(payload)

  let response = await uploadArtifactRequest(formData, token)

  if (response.status === 401) {
    const refreshed = await authStore.refreshToken()
    token = refreshed ? authStore.getToken() || '' : ''

    if (!token) {
      throw new Error('Authentication expired')
    }

    response = await uploadArtifactRequest(formData, token)
  }

  if (!response.ok && payload.fileType?.trim() && [400, 422].includes(response.status)) {
    const fallbackFormData = buildArtifactUploadFormData(payload, false)
    response = await uploadArtifactRequest(fallbackFormData, token)

    if (response.status === 401) {
      const refreshed = await authStore.refreshToken()
      token = refreshed ? authStore.getToken() || '' : ''

      if (!token) {
        throw new Error('Authentication expired')
      }

      response = await uploadArtifactRequest(fallbackFormData, token)
    }
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const json = await parseJsonPayload(response)
  return normalizeArtifact(unwrapArtifactEntity(json))
}
