// frontend/features/b2b-dashboard/b2b-dashboard.interface.ts

export type RiskLevel = 'critical' | 'elevated' | 'moderate' | 'low'
export type NR1RiskBand = 'baixo' | 'moderado' | 'alto' | 'critico'

export interface B2BOverviewTimeline {
  month: string
  scoreOverall: number | null
}

export interface B2BOverviewPsychosocialAxes {
  workload: number | null
  pace: number | null
  autonomy: number | null
  leadership: number | null
  relationships: number | null
  recognition: number | null
  clarity: number | null
  balance: number | null
}

export interface B2BOverviewData {
  total: number
  cycleId: string
  scorePhysical: number | null
  scoreErgonomic: number | null
  scorePsychosocial: number | null
  scoreViolence: number | null
  scoreOverall: number | null
  riskDistribution: Record<NR1RiskBand, number>
  psychosocialAxes: B2BOverviewPsychosocialAxes
  pendingActions: number
  incidentsThisCycle: number
  harassmentCount: number
  alertCount: number
  timeline: B2BOverviewTimeline[]
}

export interface B2BDepartmentData {
  name: string
  n: number
  scorePhysical: number | null
  scoreErgonomic: number | null
  scorePsychosocial: number | null
  scoreViolence: number | null
  scoreOverall: number | null
  pendingActions: number
}

export interface B2BDomainsData {
  domains: Array<{
    name: string
    key: string
    avg: number | null
    n: number
  }>
  cycleId: string
}

export interface B2BComplianceItem {
  id: number
  ref: string
  description: string
  status: 'conforme' | 'parcial' | 'pendente'
  detail: string
}

export interface B2BComplianceData {
  groIssuedAt: string | null
  groValidUntil: string | null
  totalEvaluations: number
  approvedCount: number
  coveragePct: number
  cycle: {
    id: string
    label: string
    starts_at: string
    ends_at: string
  } | null
  items: B2BComplianceItem[]
  conformeCount: number
  totalItems: number
}

export interface B2BComplianceChecklistItem {
  id: string
  label: string
  status: 'done' | 'partial' | 'pending'
}

export interface B2BActionPlanItem {
  level: RiskLevel
  title: string
  items: string[]
}

export interface B2BAlertData {
  type:
    | 'action_overdue'
    | 'psychosocial_high'
    | 'nr1_docs_missing'
    | 'incident'
    | 'harassment'
  severity: 'critico' | 'alto' | 'moderado'
  department: string | null
  message: string
  value?: number
  /** Optional foreign-key to the underlying entity (e.g. action plan id) */
  refId?: string
  /** ISO date string for time-based alerts (e.g. action deadline) */
  dueDate?: string
}

export interface B2BAlertsData {
  alerts: B2BAlertData[]
  cycleId: string
}

// --- GRO / NR-1 Risk Inventory ---

export interface B2BGRODomainSummary {
  label: string
  score: number | null
  band: NR1RiskBand | null
}

export interface B2BGROData {
  domainSummary: B2BGRODomainSummary[]
  chemicalExposures: Record<string, number>
  biologicalExposures: Record<string, number>
  incidentsByType: Record<string, number>
  riskMatrix: number[][]
  cycleId: string
}

// --- Action Plans ---

export type ActionPlanPriority = 'critica' | 'alta' | 'media' | 'baixa'
export type ActionPlanStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluido'
  | 'agendado'

export interface B2BActionPlan {
  id: string
  company_id: string
  cycle_id?: string
  description: string
  department?: string
  priority: ActionPlanPriority
  status: ActionPlanStatus
  responsible?: string
  deadline?: string
  notes?: string
  ai_generated: boolean
  ai_review_pending: boolean
  created_by?: string | null
  created_at: string
}

export type CreateActionPlanInput = Omit<
  B2BActionPlan,
  'id' | 'company_id' | 'created_at' | 'ai_generated' | 'ai_review_pending' | 'created_by'
>

export type UpdateActionPlanInput = Partial<CreateActionPlanInput> & {
  planId: string
  ai_review_pending?: boolean
}

// --- Events & Nexo ---

export type EventType = 'afastamento' | 'relato_canal' | 'acidente' | 'incidente' | 'atestado' | 'outro'

export interface B2BEvent {
  id: string
  company_id: string
  event_date: string
  event_type: EventType
  cid_code?: string
  description: string
  department?: string
  days_lost?: number
  source: string
  created_at: string
}

export type CreateEventInput = Omit<
  B2BEvent,
  'id' | 'company_id' | 'created_at'
>

export type UpdateEventInput = Partial<CreateEventInput> & { eventId: string }

export interface B2BEventsKPIs {
  afastamentos90d: number
  diasPerdidos: number
  relatosCanal: number
}

export interface B2BEventsData {
  events: B2BEvent[]
  kpis: B2BEventsKPIs
}

// --- Percepcao / Insights ---

export interface B2BInsightsScaleAverages {
  phq9: number | null
  gad7: number | null
  isi: number | null
  mbi: number | null
}

export type B2BPercepcaoData =
  | { enabled: false }
  | {
      enabled: true
      scaleAverages: B2BInsightsScaleAverages
      assessmentCount: number
      cycleId: string
    }

// --- Reports ---

export type ReportType =
  | 'gro-consolidado'
  | 'por-departamento'
  | 'csv-export'
  | 'nr1-inventario'

export interface B2BReportRequest {
  type: ReportType
  department?: string
  cycleId?: string
}

export interface B2BReportResponse {
  url: string
  filename: string
  generatedAt: string
}

export interface B2BReportDownloadResult {
  generatedAt: string
}

// --- NR-1 Fields & Settings ---

export interface B2BNR1Data {
  nr1_process_descriptions: string | null
  nr1_activities: string | null
  nr1_preventive_measures: string[] | null
  sst_responsible_name: string | null
  sst_responsible_role: string | null
  sst_signature_url: string | null
  cnae: string | null
  risk_grade: string | null
  emergency_sop_urls: B2BSOPDocument[] | null
}

export interface B2BSOPDocument {
  name: string
  url: string
  uploaded_at: string
}

export type PdfExtractionType = 'nr1-fields' | 'events-bulk'

export interface PdfExtractionNR1Result {
  process_descriptions: string
  activities: string
  preventive_measures: string[]
}

export interface PdfExtractionEventsResult {
  events: B2BEvent[]
}

export interface PdfExtractionResponse {
  extracted: PdfExtractionNR1Result | PdfExtractionEventsResult
  confidence: number
  warnings: string[]
}

export interface DashboardFilters {
  departments?: string[]
  riskLevels?: string[]
  dateFrom?: string
  dateTo?: string
  instrument?: string
}

export type EmployeeTrackingStatus = 'pendente' | 'iniciou' | 'completou'

export interface B2BEmployeeTrackingEmployee {
  email: string
  department: string
  status: EmployeeTrackingStatus
}

export interface B2BEmployeeTrackingDepartment {
  name: string
  total: number
  completed: number
}

export interface B2BEmployeeTrackingData {
  total: number
  completed: number
  started: number
  pending: number
  completionPct: number
  byDepartment: B2BEmployeeTrackingDepartment[]
  employees: B2BEmployeeTrackingEmployee[]
}
