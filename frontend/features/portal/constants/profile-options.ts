// frontend/features/portal/constants/profile-options.ts

export const PROFILE_OPTIONS = [
  { value: 'adulto', label: 'Adulto', color: '#00c9b1', bg: 'rgba(0, 201, 177, 0.15)' },
  { value: 'infantil', label: 'Infantil', color: '#0090ff', bg: 'rgba(0, 144, 255, 0.15)' },
  { value: 'neuro', label: 'Neuro', color: '#9b59b6', bg: 'rgba(155, 89, 182, 0.15)' },
  { value: 'executivo', label: 'Executivo', color: '#f5a623', bg: 'rgba(245, 166, 35, 0.15)' },
  { value: 'longevidade', label: 'Longevidade', color: '#00d896', bg: 'rgba(0, 216, 150, 0.15)' },
] as const

export const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pendente', color: '#f5a623', bg: 'rgba(245, 166, 35, 0.15)' },
  { value: 'approved', label: 'Aprovado', color: '#00d896', bg: 'rgba(0, 216, 150, 0.15)' },
  { value: 'rejected', label: 'Rejeitado', color: '#ff4d6d', bg: 'rgba(255, 77, 109, 0.15)' },
] as const
