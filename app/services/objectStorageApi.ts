import type { CatalogArtifact } from './catalogApi'
import wisefoodApi from './wisefoodApi'
import { useAuthStore } from '~/stores/auth'
import { getWisefoodApiUrl } from '~/utils/runtimeConfig'

type UnknownRecord = Record<string, unknown>

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
