'use client'

import { ClipboardList, Mail, Search, Settings, Shield, Trash2, UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BulkInviteComponent } from './BulkInviteComponent'
import { DepartmentsSection } from './DepartmentsSection'

interface EvaluationEntry {
  id: string
  patient_name: string | null
  patient_email: string | null
  employee_department: string | null
  status: string | null
  reviewer_status: string | null
  created_at: string
  cycle_id: string | null
}

interface SettingsUser {
  id: string
  user_id: string
  role: string
  email: string | null
  created_at: string
}

interface PendingInvite {
  id: string
  employee_email: string | null
  department: string | null
  created_at: string
  cycle_id: string | null
}

interface SettingsData {
  users: SettingsUser[]
  allowed_domains: string[]
  departments: string[]
  company_name: string | null
  collaborators: {
    evaluations: EvaluationEntry[]
    pending_invites: PendingInvite[]
  }
}

type SubTab = 'admins' | 'collaborators'

interface CompanySettingsComponentProps {
  companyId: string
  mode: 'b2b' | 'portal'
}

function getApiBase(mode: 'b2b' | 'portal') {
  return mode === 'b2b' ? '/api/b2b' : '/api/portal/companies'
}

export function CompanySettingsComponent({ companyId, mode }: CompanySettingsComponentProps) {
  const [data, setData] = useState<SettingsData | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [subTab, setSubTab] = useState<SubTab>('admins')
  const [showInvite, setShowInvite] = useState(false)
  const hasFetched = useRef(false)
  const apiBase = getApiBase(mode)

  const fetchSettings = useCallback(async () => {
    if (!companyId) return
    if (!hasFetched.current) setInitialLoading(true)
    try {
      const url = `${apiBase}/${companyId}/settings`
      const res = await fetch(url)
      if (res.ok) setData(await res.json())
    } finally {
      setInitialLoading(false)
      hasFetched.current = true
    }
  }, [companyId, apiBase])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-[#14B8A6]" />
        <h2 className="text-[16px] font-semibold text-[#E2E8F0]">
          Configurações {data?.company_name ? `— ${data.company_name}` : ''}
        </h2>
      </div>

      <AllowedDomainsSection
        companyId={companyId}
        domains={data?.allowed_domains ?? []}
        apiBase={apiBase}
        onUpdate={fetchSettings}
      />

      <DepartmentsSection
        companyId={companyId}
        departments={data?.departments ?? []}
        apiBase={apiBase}
        onUpdate={fetchSettings}
      />

      {/* Tab container */}
      <div className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33]">
        {/* Tab header bar */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-1 pt-1">
          <div className="flex gap-0.5">
            <button
              onClick={() => { setSubTab('admins'); setShowInvite(false) }}
              className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
                subTab === 'admins'
                  ? 'bg-[#0E1E33] text-[#14B8A6] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-[#0E1E33]'
                  : 'text-[#64748B] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#E2E8F0]'
              }`}
            >
              <Shield className="h-4 w-4" />
              Administradores
              {(data?.users?.length ?? 0) > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  subTab === 'admins' ? 'bg-[#14B8A6]/15 text-[#14B8A6]' : 'bg-[#132540] text-[#94A3B8]'
                }`}>
                  {data!.users.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setSubTab('collaborators'); setShowInvite(false) }}
              className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
                subTab === 'collaborators'
                  ? 'bg-[#0E1E33] text-[#14B8A6] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-[#0E1E33]'
                  : 'text-[#64748B] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#E2E8F0]'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Colaboradores
              {((data?.collaborators?.evaluations?.length ?? 0) + (data?.collaborators?.pending_invites?.length ?? 0)) > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                  subTab === 'collaborators' ? 'bg-[#14B8A6]/15 text-[#14B8A6]' : 'bg-[#132540] text-[#94A3B8]'
                }`}>
                  {(data?.collaborators?.evaluations?.length ?? 0) + (data?.collaborators?.pending_invites?.length ?? 0)}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowInvite((v) => !v)}
            className={`mr-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              showInvite
                ? 'bg-[#14B8A6]/15 text-[#14B8A6]'
                : 'text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#E2E8F0]'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {showInvite ? 'Fechar convite' : 'Convidar pessoas'}
          </button>
        </div>

        {/* Tab content panel */}
        <div className="p-5">
          {showInvite && (
            <div className="mb-5">
              <BulkInviteComponent
                companyId={companyId}
                role={subTab === 'admins' ? 'admin' : 'collaborator'}
                departments={data?.departments ?? []}
                apiBase={apiBase}
                onInvited={() => { fetchSettings(); setShowInvite(false) }}
              />
            </div>
          )}

          {subTab === 'admins' && (
            <AdminUsersTable
              companyId={companyId}
              users={data?.users ?? []}
              apiBase={apiBase}
              onUpdate={fetchSettings}
            />
          )}

          {subTab === 'collaborators' && (
            <CollaboratorsSection
              evaluations={data?.collaborators?.evaluations ?? []}
              pendingInvites={data?.collaborators?.pending_invites ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Allowed Domains ─── */

function AllowedDomainsSection({
  companyId,
  domains,
  apiBase,
  onUpdate,
}: {
  companyId: string
  domains: string[]
  apiBase: string
  onUpdate: () => void
}) {
  const [localDomains, setLocalDomains] = useState(domains)
  const [newDomain, setNewDomain] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalDomains(domains)
  }, [domains])

  const save = async (updated: string[]) => {
    setLocalDomains(updated)
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/${companyId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_domains', domains: updated }),
      })
      if (!res.ok) setLocalDomains(domains)
    } catch {
      setLocalDomains(domains)
    } finally {
      setSaving(false)
    }
  }

  const add = () => {
    const d = newDomain.trim().toLowerCase()
    if (!d || localDomains.includes(d)) return
    setNewDomain('')
    void save([...localDomains, d])
  }

  const remove = (domain: string) => {
    void save(localDomains.filter((d) => d !== domain))
  }

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
      <div className="mb-1 flex items-center gap-2">
        <Mail className="h-4 w-4 text-[#14B8A6]" />
        <h3 className="text-[13px] font-semibold text-[#E2E8F0]">
          Domínios de Email Permitidos
        </h3>
      </div>
      <p className="mb-4 text-[11px] text-[#64748B]">
        Usuários com email destes domínios podem se cadastrar automaticamente.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {localDomains.map((d) => (
          <span
            key={d}
            className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#132540] px-3 py-1 text-[12px] text-[#E2E8F0]"
          >
            @{d}
            <button
              onClick={() => remove(d)}
              disabled={saving}
              className="text-[#64748B] hover:text-[#F87171]"
            >
              ×
            </button>
          </span>
        ))}
        {localDomains.length === 0 && (
          <span className="text-[11px] text-[#64748B]">Nenhum domínio cadastrado</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="empresa.com.br"
          className="w-56 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />
        <button
          onClick={add}
          disabled={saving || !newDomain.trim()}
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          {saving ? '...' : 'Adicionar'}
        </button>
      </div>
    </div>
  )
}

/* ─── Admin Users Table ─── */

function AdminUsersTable({
  companyId,
  users,
  apiBase,
  onUpdate,
}: {
  companyId: string
  users: SettingsUser[]
  apiBase: string
  onUpdate: () => void
}) {
  const [removing, setRemoving] = useState<string | null>(null)

  const remove = async (userId: string) => {
    setRemoving(userId)
    try {
      await fetch(`${apiBase}/${companyId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_user', userId }),
      })
      onUpdate()
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div>
      {users.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-[#64748B]">Nenhum administrador vinculado.</p>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Email</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Papel</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Desde</th>
              <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[rgba(255,255,255,0.04)]">
                <td className="px-3 py-2.5 font-medium text-[#E2E8F0]">
                  {u.email ?? u.user_id.slice(0, 8)}
                </td>
                <td className="px-3 py-2.5 text-[#94A3B8]">{u.role}</td>
                <td className="px-3 py-2.5 text-[#94A3B8]">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={() => remove(u.user_id)}
                    disabled={removing === u.user_id}
                    className="inline-flex items-center gap-1 text-[11px] text-[#F87171] transition-colors hover:text-[#EF4444] disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" />
                    {removing === u.user_id ? '...' : 'Remover'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/* ─── Collaborators (Employees) ─── */

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completo', color: '#34D399' },
  report_generated: { label: 'Relatório gerado', color: '#34D399' },
  in_progress: { label: 'Em andamento', color: '#F59E0B' },
  pending: { label: 'Pendente', color: '#94A3B8' },
  started: { label: 'Iniciado', color: '#60A5FA' },
  invited: { label: 'Convidado', color: '#A78BFA' },
  code_sent: { label: 'Código enviado', color: '#A78BFA' },
}

function CollaboratorsSection({
  evaluations,
  pendingInvites,
}: {
  evaluations: EvaluationEntry[]
  pendingInvites: PendingInvite[]
}) {
  const [search, setSearch] = useState('')

  const collaborators = useMemo(() => {
    const map = new Map<string, {
      key: string
      name: string | null
      email: string | null
      department: string | null
      status: string
      date: string
    }>()

    for (const ev of evaluations) {
      const key = ev.patient_email ?? ev.id
      const existing = map.get(key)
      if (!existing || new Date(ev.created_at) > new Date(existing.date)) {
        map.set(key, {
          key,
          name: ev.patient_name,
          email: ev.patient_email,
          department: ev.employee_department,
          status: ev.status ?? 'pending',
          date: ev.created_at,
        })
      }
    }

    for (const inv of pendingInvites) {
      const key = inv.employee_email ?? inv.id
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: null,
          email: inv.employee_email,
          department: inv.department,
          status: 'invited',
          date: inv.created_at,
        })
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [evaluations, pendingInvites])

  const filtered = useMemo(() => {
    if (!search.trim()) return collaborators
    const q = search.toLowerCase()
    return collaborators.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q)
    )
  }, [collaborators, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of collaborators) {
      counts[c.status] = (counts[c.status] ?? 0) + 1
    }
    return counts
  }, [collaborators])

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <StatCard label="Total" value={collaborators.length} color="#14B8A6" />
        <StatCard label="Completos" value={(statusCounts['completed'] ?? 0) + (statusCounts['report_generated'] ?? 0)} color="#34D399" />
        <StatCard label="Em andamento" value={(statusCounts['in_progress'] ?? 0) + (statusCounts['started'] ?? 0)} color="#F59E0B" />
        <StatCard label="Pendentes" value={(statusCounts['pending'] ?? 0) + (statusCounts['code_sent'] ?? 0) + (statusCounts['invited'] ?? 0)} color="#94A3B8" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#132540] px-2 py-0.5 text-[10px] text-[#94A3B8]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou departamento..."
            className="w-72 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] py-2 pl-8 pr-3 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-[#64748B]">
          {search ? 'Nenhum colaborador encontrado.' : 'Nenhum colaborador registrado.'}
        </p>
      ) : (
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Nome</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Email</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Departamento</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Status</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.4px] text-[#64748B]">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = STATUS_LABELS[c.status] ?? { label: c.status, color: '#94A3B8' }
              return (
                <tr key={c.key} className="border-b border-[rgba(255,255,255,0.04)]">
                  <td className="px-3 py-2.5 font-medium text-[#E2E8F0]">{c.name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-[#94A3B8]">{c.email ?? '—'}</td>
                  <td className="px-3 py-2.5 text-[#94A3B8]">{c.department ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${st.color}15`,
                        color: st.color,
                        border: `1px solid ${st.color}30`,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#94A3B8]">
                    {new Date(c.date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#07111F] px-4 py-3"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="text-[20px] font-bold text-[#E2E8F0]">{value}</div>
      <div className="text-[11px] text-[#64748B]">{label}</div>
    </div>
  )
}
