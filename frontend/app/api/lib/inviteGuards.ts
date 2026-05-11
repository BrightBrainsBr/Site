// frontend/app/api/lib/inviteGuards.ts

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a human-readable error message if `email` is already attached to
 * the given `companyId` + `cycleId` (either as an active invite or as a
 * past/in-progress evaluation). Returns `null` when the email is free to
 * invite. Used by both b2b and portal `invite_bulk` handlers to prevent
 * duplicate collaborators within the same assessment cycle.
 */
export async function findDuplicateCollaboratorError(
  sb: SupabaseClient,
  companyId: string,
  cycleId: string,
  email: string
): Promise<string | null> {
  const { data: existingInvite } = await sb
    .from('company_access_codes')
    .select('id')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleId)
    .eq('employee_email', email)
    .eq('active', true)
    .maybeSingle()
  if (existingInvite) return 'Email já convidado para este ciclo'

  const { data: existingEval } = await sb
    .from('evaluations')
    .select('id')
    .eq('company_id', companyId)
    .eq('cycle_id', cycleId)
    .eq('patient_email', email)
    .limit(1)
    .maybeSingle()
  if (existingEval) return 'Email já possui avaliação neste ciclo'

  return null
}
