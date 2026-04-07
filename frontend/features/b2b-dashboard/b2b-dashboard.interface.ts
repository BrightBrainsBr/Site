// frontend/features/b2b-dashboard/b2b-dashboard.interface.ts

export type RiskLevel = 'critical' | 'elevated' | 'moderate' | 'low'

export interface B2BOverviewTimeline {
  month: string
  baixo: number
  moderado: number
  elevado: number
  critico: number
}

export interface B2BOverviewData {
  total: number
  avgScore: number | null
  riskDistribution: Record<RiskLevel, number>
  burnoutIndex: number | null
  cycleId: string
  phq9Avg: number | null
  gad7Avg: number | null
  srq20Avg: number | null
  aepAvg: number | null
  alertCount: number
  timeline: B2BOverviewTimeline[]
}

export interface B2BDepartmentData {
  name: string
  n: number
  avgScore: number
  riskBreakdown: Record<RiskLevel, number>
  trend: 'up' | 'down' | 'stable' | null
  phq9Avg: number | null
  gad7Avg: number | null
  srq20Avg: number | null
  aepAvg: number | null
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
  id: string
  riskLevel: string
  department: string | null
  domainScores?: Record<string, number>
  srq20Score?: number
  srq20Risk?: string
  aepScore?: number
  aepRisk?: string
  reasons?: string[]
}

export interface B2BAlertsData {
  alerts: B2BAlertData[]
  cycleId: string
}

// --- GRO Psicossocial ---

export interface B2BGROData {
  scaleAverages: Record<string, number>
  aepDimensions: Record<string, number>
  srq20Distribution: {
    negative: number
    moderate: number
    elevated: number
    critical: number
  }
  riskMatrix: number[][]
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
  created_at: string
}

export type CreateActionPlanInput = Omit<
  B2BActionPlan,
  'id' | 'company_id' | 'created_at' | 'ai_generated'
>

export type UpdateActionPlanInput = Partial<CreateActionPlanInput> & {
  planId: string
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

// --- Percepcao ---

export interface B2BPercepcaoReport {
  id: string
  report_type: string
  urgencia: string
  department?: string
  impacto?: string
  descricao: string
  sugestao?: string
  source: string
  created_at: string
}

export interface B2BPercepcaoCorrelation {
  description: string
  severity: string
}

export interface B2BPercepcaoData {
  total: number
  byType: Record<string, number>
  urgentes: number
  topSetor: string
  reports: B2BPercepcaoReport[]
  correlations: B2BPercepcaoCorrelation[]
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
