import wisefoodRestApi from './wisefoodRestApi'

export interface FoodScholarGuidelineStorage {
  artifact_uuid: string
  workspace_root: string
  artifact_dir: string
  pdf_filename: string
  pdf_path: string
  pdf_exists: boolean
}

export interface FoodScholarProcessedPage {
  page: number
  /**
   * What the page covered, in the model's words. Written during extraction and
   * carried forward to the next page so structures spanning a page break (most
   * importantly two-page tables) survive.
   */
  page_summary: string
  guideline_count: number
  continues_from_previous?: boolean
}

export interface FoodScholarSkippedPage {
  page: number
  decision: string
  reason: string
  continues_from_previous?: boolean
}

/**
 * What the guide is, as used during extraction.
 *
 * Assembled from the catalog record and, where that left the population
 * unestablished, from a profile pass over the guide's own opening pages.
 * `derived_fields` names the values that came from the document rather than
 * from curated metadata.
 */
export interface FoodScholarGuideContext {
  guide_urn?: string | null
  title?: string | null
  region?: string | null
  audience?: string | null
  target_audiences?: string[]
  language?: string | null
  publication_year?: number | null
  issuing_authority?: string | null
  population_note?: string | null
  age_min_months?: number | null
  age_max_months?: number | null
  scope_note?: string | null
  evidence?: string[]
  derived_fields?: string[]
}

export interface FoodScholarDocumentProfile extends FoodScholarGuideContext {
  pages_read?: number[]
}

export interface FoodScholarExtractedGuideline {
  page: number
  text: string
  /** Facet hints and provenance; present only on schema_version 2 results. */
  section_label?: string | null
  source_snippet?: string | null
  target_population_hint?: string | null
  age_min_months?: number | null
  age_max_months?: number | null
  life_stage?: string[]
  setting?: string[]
  health_conditions?: string[]
  nutrients?: string[]
  guideline_type?: string | null
  topic?: string[]
  action_type_hint?: string | null
  confidence?: number | null
}

export interface FoodScholarGuidelineExtractionResult {
  artifact_uuid: string
  workspace_root: string
  artifact_dir: string
  pdf_path: string
  model: string
  dpi: number
  extracted_at: string
  total_pages: number
  total_processed_pages: number
  total_skipped_pages: number
  total_guidelines: number
  total_unique_guidelines: number
  processed_pages: FoodScholarProcessedPage[]
  skipped_pages: FoodScholarSkippedPage[]
  guidelines: FoodScholarExtractedGuideline[]
  unique_guidelines: string[]
  /** 1 = {page, text} only; 2 = per-rule facet hints and guide context. */
  schema_version?: number
  guide_context?: FoodScholarGuideContext | null
  document_profile?: FoodScholarDocumentProfile | null
  continuation_pages?: number[]
}

export interface FoodScholarGuidelineExtractionStatus {
  artifact_uuid: string
  status: string
  job_id?: string | null
  model?: string | null
  dpi?: number | null
  enqueued_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  current_page?: number | null
  total_pages?: number | null
  error?: string | null
  storage?: FoodScholarGuidelineStorage | null
  result?: FoodScholarGuidelineExtractionResult | null
}

export interface FoodScholarGuidelineImportRequest {
  guide_id: string
  dry_run: boolean
  dedupe_against_guide: boolean
  action_type: string
  existing_scan_limit: number
}

export interface FoodScholarGuidelineImportItem {
  rule_text: string
  page_no: number
  action_type: string
  sequence_no: number | null
  status: string
  reason?: string | null
  created_id?: string | null
}

export interface FoodScholarGuidelineImportResult {
  artifact_uuid: string
  guide_id: string
  dry_run: boolean
  extracted_at: string
  source_guideline_count: number
  total_candidates: number
  existing_guidelines_scanned: number
  total_created: number
  total_skipped: number
  next_sequence_no_start: number
  items: FoodScholarGuidelineImportItem[]
}

export interface FoodScholarExtractionOptions {
  /** Guide whose metadata is injected into the extraction prompts. */
  guide_id?: string
  model?: string
  dpi?: number
  /** Read the guide's opening pages when the catalog record is thin. */
  profile_document?: boolean
  profile_page_count?: number
}

export interface FoodScholarEnrichmentPreviewRequest {
  guide_urn: string
  limit?: number
  allow_pdf_profile?: boolean
}

export interface FoodScholarEnrichmentProposal {
  id: string
  rule_text: string
  facets: Record<string, unknown>
}

export interface FoodScholarEnrichmentPreview {
  guide_urn: string
  version: number
  /** Where the guide context came from: catalog, extraction_result, document_profile. */
  context_sources: string[]
  guide_context: string
  examined: number
  would_enrich: number
  no_facets: number
  failed: number
  proposals: FoodScholarEnrichmentProposal[]
}

export interface FoodScholarEnrichmentEnqueueRequest {
  guide_urns?: string[]
  force?: boolean
  allow_pdf_profile?: boolean
}

export interface FoodScholarEnrichmentEnqueueResult {
  queued: number
  guide_urns: string[]
  version: number
  force: boolean
}

export interface FoodScholarEnrichmentGuideProgress {
  guide_urn: string
  status: string
  version: number
  total: number
  enriched: number
  skipped_version: number
  skipped_no_facets: number
  failed: number
  context_sources: string[]
  error?: string | null
  started_at?: string | null
  finished_at?: string | null
}

export interface FoodScholarEnrichmentStatus {
  version: number
  queue_key: string
  pending_jobs: number | null
  guides: FoodScholarEnrichmentGuideProgress[]
  totals: { guides: number, enriched: number, skipped_version: number, failed: number }
}

export interface FoodScholarCorpusGuide {
  guide_urn: string
  total: number
  retrievable: number
  status: Record<string, number>
  review_status: Record<string, number>
  enriched: number
}

export interface FoodScholarCorpusAudit {
  total: number
  /** Guidelines the retrieval gate will actually surface. */
  retrievable: number
  retrievable_share: number
  unenriched: number
  status: Record<string, number>
  review_status: Record<string, number>
  visibility: Record<string, number>
  guides: FoodScholarCorpusGuide[]
  warning?: string | null
}

class FoodScholarGuidelinesApiService {
  private readonly basePath = '/foodscholar/guidelines'

  async getStorage(artifactUuid: string): Promise<FoodScholarGuidelineStorage | string> {
    return wisefoodRestApi.get<FoodScholarGuidelineStorage | string>(`${this.basePath}/storage/${encodeURIComponent(artifactUuid)}`)
  }

  /**
   * Queue an extraction run.
   *
   * Always pass `guide_id` when the guide is known: it is what lets an
   * extracted rule carry its population, so "Provide portions of red meat twice
   * a week" stays attributable to the 1-4 year-olds guide it came from.
   */
  async enqueueExtraction(
    artifactUuid: string,
    options: FoodScholarExtractionOptions = {}
  ): Promise<FoodScholarGuidelineExtractionStatus | string> {
    return wisefoodRestApi.post<FoodScholarGuidelineExtractionStatus | string, FoodScholarExtractionOptions>(
      `${this.basePath}/extract/${encodeURIComponent(artifactUuid)}`,
      options
    )
  }

  async getExtractionStatus(artifactUuid: string): Promise<FoodScholarGuidelineExtractionStatus | string> {
    return wisefoodRestApi.get<FoodScholarGuidelineExtractionStatus | string>(`${this.basePath}/extract/${encodeURIComponent(artifactUuid)}`)
  }

  async importGuidelines(
    artifactUuid: string,
    payload: FoodScholarGuidelineImportRequest
  ): Promise<FoodScholarGuidelineImportResult | string> {
    return wisefoodRestApi.post<FoodScholarGuidelineImportResult | string, FoodScholarGuidelineImportRequest>(
      `${this.basePath}/import/${encodeURIComponent(artifactUuid)}`,
      payload
    )
  }

  // ----------------------------------------------------------------------- #
  // Post-extraction facet enrichment
  // ----------------------------------------------------------------------- #

  /** Sample a guide's rules and return proposed facets without writing. */
  async previewEnrichment(
    payload: FoodScholarEnrichmentPreviewRequest
  ): Promise<FoodScholarEnrichmentPreview | string> {
    return wisefoodRestApi.post<FoodScholarEnrichmentPreview | string, FoodScholarEnrichmentPreviewRequest>(
      `${this.basePath}/enrichment/preview`,
      payload
    )
  }

  /** Queue enrichment for named guides, or for every guide when omitted. */
  async enqueueEnrichment(
    payload: FoodScholarEnrichmentEnqueueRequest = {}
  ): Promise<FoodScholarEnrichmentEnqueueResult | string> {
    return wisefoodRestApi.post<FoodScholarEnrichmentEnqueueResult | string, FoodScholarEnrichmentEnqueueRequest>(
      `${this.basePath}/enrichment/enqueue`,
      payload
    )
  }

  async getEnrichmentStatus(): Promise<FoodScholarEnrichmentStatus | string> {
    return wisefoodRestApi.get<FoodScholarEnrichmentStatus | string>(
      `${this.basePath}/enrichment/status`
    )
  }

  // ----------------------------------------------------------------------- #
  // Corpus state and activation
  // ----------------------------------------------------------------------- #

  async auditCorpus(): Promise<FoodScholarCorpusAudit | string> {
    return wisefoodRestApi.get<FoodScholarCorpusAudit | string>(
      `${this.basePath}/corpus/audit`
    )
  }

  async getActivationPlan(requireVerified = true): Promise<unknown> {
    return wisefoodRestApi.get(`${this.basePath}/corpus/activation-plan`, {
      params: { require_verified: requireVerified }
    })
  }

  async activateGuide(
    guideUrn: string,
    options: { requireVerified?: boolean, dryRun?: boolean } = {}
  ): Promise<unknown> {
    return wisefoodRestApi.post(
      `${this.basePath}/corpus/activate/${guideUrn}`,
      undefined,
      {
        params: {
          require_verified: options.requireVerified ?? true,
          dry_run: options.dryRun ?? true
        }
      }
    )
  }
}

export default new FoodScholarGuidelinesApiService()
