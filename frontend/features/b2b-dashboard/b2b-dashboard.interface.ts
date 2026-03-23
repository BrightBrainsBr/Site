// frontend/features/b2b-dashboard/b2b-dashboard.interface.ts

export type RiskLevel = 'critical' | 'elevated' | 'moderate' | 'low'

export interface B2BOverviewData {
  total: number
  avgScore: number | null
  riskDistribution: Record<RiskLevel, number>
  burnoutIndex: number | null
  cycleId: string
}

export interface B2BDepartmentData {
  name: string
  n: number
  avgScore: number
  riskBreakdown: Record<RiskLevel, number>
  trend: 'up' | 'down' | 'stable' | null
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
}

export interface B2BAlertsData {
  alerts: B2BAlertData[]
  cycleId: string
}
