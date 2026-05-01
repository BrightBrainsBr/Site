// frontend/features/assessment/services/localStorage.ts

import type { AssessmentFormData } from '../components/assessment.interface'
import { INITIAL_FORM_DATA } from '../components/assessment.interface'

const LEGACY_STORAGE_KEY = 'bb_assessment_data'
const LEGACY_STEP_KEY = 'bb_assessment_step'
const OWNER_KEY = 'bb_assessment_owner'

// We scope draft data per authenticated user so switching invites/emails
// in the same browser cannot leak draft answers between people. Anonymous
// drafts (no owner yet) keep the legacy unscoped key for back-compat.
function dataKey(owner: string | null): string {
  if (!owner) return LEGACY_STORAGE_KEY
  return `${LEGACY_STORAGE_KEY}:${owner.toLowerCase().trim()}`
}

function stepKey(owner: string | null): string {
  if (!owner) return LEGACY_STEP_KEY
  return `${LEGACY_STEP_KEY}:${owner.toLowerCase().trim()}`
}

function clearAllAssessmentKeys(): void {
  try {
    const remove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (
        k === LEGACY_STORAGE_KEY ||
        k === LEGACY_STEP_KEY ||
        k.startsWith(`${LEGACY_STORAGE_KEY}:`) ||
        k.startsWith(`${LEGACY_STEP_KEY}:`)
      ) {
        remove.push(k)
      }
    }
    for (const k of remove) localStorage.removeItem(k)
  } catch {
    // ignore
  }
}

/**
 * Call once per page load with the resolved authenticated user (email or null
 * for anonymous flows). If the owner has changed since the last session, all
 * stale draft data is wiped so a new user never inherits the previous one's
 * answers.
 */
export function ensureOwner(owner: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const normalized = owner?.toLowerCase().trim() ?? ''
    const previous = localStorage.getItem(OWNER_KEY) ?? ''
    if (normalized && normalized !== previous) {
      clearAllAssessmentKeys()
      localStorage.setItem(OWNER_KEY, normalized)
    } else if (!previous && !normalized) {
      // first anonymous visit, nothing to do
    } else if (!normalized && previous) {
      // logged-out fresh anonymous flow → wipe everything
      clearAllAssessmentKeys()
      localStorage.removeItem(OWNER_KEY)
    }
  } catch {
    // ignore
  }
}

export function saveFormData(
  data: AssessmentFormData,
  owner: string | null = null
): void {
  try {
    localStorage.setItem(dataKey(owner), JSON.stringify(data))
  } catch {
    // localStorage full or unavailable
  }
}

export function loadFormData(owner: string | null = null): AssessmentFormData {
  try {
    const raw = localStorage.getItem(dataKey(owner))
    if (!raw) return { ...INITIAL_FORM_DATA }
    const parsed = JSON.parse(raw) as Partial<AssessmentFormData>
    return { ...INITIAL_FORM_DATA, ...parsed }
  } catch {
    return { ...INITIAL_FORM_DATA }
  }
}

export function clearFormData(owner: string | null = null): void {
  try {
    localStorage.removeItem(dataKey(owner))
    localStorage.removeItem(stepKey(owner))
    if (!owner) {
      // also wipe any per-owner drafts when an anonymous reset is triggered
      clearAllAssessmentKeys()
    }
  } catch {
    // ignore
  }
}

export function saveCurrentStep(
  stepIndex: number,
  owner: string | null = null
): void {
  try {
    localStorage.setItem(stepKey(owner), String(stepIndex))
  } catch {
    // ignore
  }
}

export function loadCurrentStep(owner: string | null = null): number {
  try {
    const raw = localStorage.getItem(stepKey(owner))
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}
