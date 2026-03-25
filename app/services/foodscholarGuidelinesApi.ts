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
  page_summary: string
  guideline_count: number
}

export interface FoodScholarSkippedPage {
  page: number
  decision: string
  reason: string
}

export interface FoodScholarExtractedGuideline {
  page: number
  text: string
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

class FoodScholarGuidelinesApiService {
  private readonly basePath = '/foodscholar/guidelines'

  async getStorage(artifactUuid: string): Promise<FoodScholarGuidelineStorage | string> {
    return wisefoodRestApi.get<FoodScholarGuidelineStorage | string>(`${this.basePath}/storage/${encodeURIComponent(artifactUuid)}`)
  }

  async enqueueExtraction(artifactUuid: string): Promise<FoodScholarGuidelineExtractionStatus | string> {
    return wisefoodRestApi.post<FoodScholarGuidelineExtractionStatus | string>(`${this.basePath}/extract/${encodeURIComponent(artifactUuid)}`)
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
}

export default new FoodScholarGuidelinesApiService()
