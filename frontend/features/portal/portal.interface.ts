// frontend/features/portal/portal.interface.ts

import type { AssessmentFormData } from '~/features/assessment/components/assessment.interface'

export type ReviewerStatus = 'pending_review' | 'approved' | 'rejected'

export type SortOption = 'date_desc' | 'date_asc' | 'name_asc'

export interface FormDataHistoryEntry {
  timestamp: string
  changed_by: string
  changed_fields: string[]
}

export interface EvaluationListItem {
  id: string
  patient_name: string | null
  patient_profile: string | null
  patient_email: string | null
  created_at: string
  status: string | null
  reviewer_status: ReviewerStatus | null
  report_pdf_url: string | null
  scores: Record<string, number> | null
}

export interface DoctorUploadEntry {
  name: string
  url: string
  type: string
  path: string
  uploaded_at: string
}

export interface ReportHistoryEntry {
  report_markdown: string
  report_pdf_url: string | null
  generated_at: string
}

export interface EvaluationDetail extends EvaluationListItem {
  form_data: AssessmentFormData | null
  report_markdown: string | null
  reviewer_notes: string | null
  approved_at: string | null
  approved_by: string | null
  form_data_history: FormDataHistoryEntry[] | null
  doctor_uploads: DoctorUploadEntry[] | null
  report_history: ReportHistoryEntry[] | null
  processing_error: string | null
}
