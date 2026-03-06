// frontend/services/assessment/localStorage.ts

import type { AssessmentFormData } from '../../components/assessment/assessment.interface'
import { INITIAL_FORM_DATA } from '../../components/assessment/assessment.interface'

const STORAGE_KEY = 'bb_assessment_data'
const STEP_KEY = 'bb_assessment_step'

export function saveFormData(data: AssessmentFormData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable
  }
}

export function loadFormData(): AssessmentFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...INITIAL_FORM_DATA }
    const parsed = JSON.parse(raw) as Partial<AssessmentFormData>
    return { ...INITIAL_FORM_DATA, ...parsed }
  } catch {
    return { ...INITIAL_FORM_DATA }
  }
}

export function clearFormData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STEP_KEY)
  } catch {
    // ignore
  }
}

export function saveCurrentStep(stepIndex: number): void {
  try {
    localStorage.setItem(STEP_KEY, String(stepIndex))
  } catch {
    // ignore
  }
}

export function loadCurrentStep(): number {
  try {
    const raw = localStorage.getItem(STEP_KEY)
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}
