// frontend/app/api/lib/allowedDomains.ts

import type { SupabaseClient } from '@supabase/supabase-js'

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.br',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'ig.com.br',
])

export function extractCorporateDomain(
  email: string | null | undefined
): string | null {
  if (!email) return null
  const at = email.lastIndexOf('@')
  if (at < 0) return null
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase()
  if (!domain || domain.length < 3 || !domain.includes('.')) return null
  if (FREE_EMAIL_DOMAINS.has(domain)) return null
  return domain
}

/**
 * Adds the corporate domain of `email` to `companies.allowed_domains` for
 * the given `companyId` if it isn't already there (free-mail providers are
 * skipped). Called synchronously at admin-invite time so the company admin
 * doesn't need to refresh / wait for the GET-time backfill — and so that
 * pending invites also extend the allow-list.
 */
export async function addCorporateDomainForEmail(
  sb: SupabaseClient,
  companyId: string,
  email: string | null | undefined
): Promise<void> {
  const domain = extractCorporateDomain(email)
  if (!domain) return
  const { data } = await sb
    .from('companies')
    .select('allowed_domains')
    .eq('id', companyId)
    .maybeSingle()
  const current = Array.isArray(data?.allowed_domains)
    ? (data?.allowed_domains as string[]).map((d) => d.toLowerCase())
    : []
  if (current.includes(domain)) return
  const next = [...current, domain]
  const { error } = await sb
    .from('companies')
    .update({ allowed_domains: next })
    .eq('id', companyId)
  if (error) {
    console.warn(
      '[allowedDomains] failed to add domain at invite time:',
      error.message
    )
  }
}

/**
 * Returns the union of `current` allowed domains and the corporate domains
 * extracted from the supplied admin emails (free-email providers excluded).
 * If new domains were added, persists the update back to `companies`.
 */
export async function ensureAdminDomainsAllowed(
  sb: SupabaseClient,
  companyId: string,
  current: string[],
  adminEmails: Array<string | null>
): Promise<string[]> {
  const normalized = current.map((d) => d.toLowerCase()).filter(Boolean)
  const merged = new Set(normalized)
  for (const email of adminEmails) {
    const domain = extractCorporateDomain(email)
    if (domain) merged.add(domain)
  }
  if (merged.size === normalized.length) return normalized
  const next = Array.from(merged)
  const { error } = await sb
    .from('companies')
    .update({ allowed_domains: next })
    .eq('id', companyId)
  if (error) {
    console.warn('[allowedDomains] failed to persist backfill:', error.message)
  }
  return next
}
