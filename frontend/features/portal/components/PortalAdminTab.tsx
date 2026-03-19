'use client'

import { useCallback, useEffect, useState } from 'react'

import { CompanyCodeGeneratorComponent } from './CompanyCodeGeneratorComponent'

interface Company {
  id: string
  name: string
  cnpj: string | null
  contact_email: string | null
  active: boolean
  allowed_domains: string[] | null
}

interface CompanyUser {
  id: string
  user_id: string
  role: string
  email: string | null
  created_at: string
}

interface PortalAdminTabProps {
  company: Company
  onCompanyUpdate: (updates: Partial<Company>) => void
}

export function PortalAdminTab({ company, onCompanyUpdate }: PortalAdminTabProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-8 py-8">
      <h2 className="text-xl font-bold text-[#cce6f7]">
        Configurações — {company.name}
      </h2>

      <AllowedDomainsSection
        companyId={company.id}
        domains={company.allowed_domains ?? []}
        onDomainsUpdate={(domains) => onCompanyUpdate({ allowed_domains: domains })}
      />

      <InviteHRSection companyId={company.id} />

      <CompanyUsersSection companyId={company.id} />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#cce6f7]">
          Códigos de Acesso
        </h3>
        <CompanyCodeGeneratorComponent companyId={company.id} />
      </div>
    </div>
  )
}

function AllowedDomainsSection({
  companyId,
  domains,
  onDomainsUpdate,
}: {
  companyId: string
  domains: string[]
  onDomainsUpdate: (domains: string[]) => void
}) {
  const [localDomains, setLocalDomains] = useState<string[]>(domains)
  const [newDomain, setNewDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalDomains(domains)
  }, [domains])

  const saveDomains = useCallback(
    async (updated: string[]) => {
      setSaving(true)
      setError(null)
      try {
        const res = await fetch(`/api/portal/companies/${companyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allowed_domains: updated }),
        })
        if (!res.ok) throw new Error('Erro ao salvar')
        setLocalDomains(updated)
        onDomainsUpdate(updated)
      } catch {
        setError('Erro ao salvar domínios')
      } finally {
        setSaving(false)
      }
    },
    [companyId, onDomainsUpdate]
  )

  const handleAdd = () => {
    const d = newDomain.trim().toLowerCase()
    if (!d || localDomains.includes(d)) return
    const updated = [...localDomains, d]
    setNewDomain('')
    void saveDomains(updated)
  }

  const handleRemove = (domain: string) => {
    const updated = localDomains.filter((d) => d !== domain)
    void saveDomains(updated)
  }

  return (
    <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
      <h3 className="mb-1 text-sm font-medium text-[#cce6f7]">
        Domínios de Email Permitidos
      </h3>
      <p className="mb-4 text-xs text-[#5a7fa0]">
        Usuários com email destes domínios podem se cadastrar automaticamente.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {localDomains.map((d) => (
          <span
            key={d}
            className="flex items-center gap-1.5 rounded-full border border-[#1a3a5c] bg-[#060e1a] px-3 py-1 text-sm text-[#cce6f7]"
          >
            @{d}
            <button
              onClick={() => handleRemove(d)}
              disabled={saving}
              className="text-[#5a7fa0] hover:text-red-400"
            >
              ×
            </button>
          </span>
        ))}
        {localDomains.length === 0 && (
          <span className="text-xs text-[#5a7fa0]">Nenhum domínio cadastrado</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="empresa.com.br"
          className="w-64 rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-sm text-[#cce6f7] placeholder-[#5a7fa0]"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newDomain.trim()}
          className="rounded-lg bg-[#00c9b1] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}

function InviteHRSection({ companyId }: { companyId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleInvite = async () => {
    if (!email.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/portal/companies/${companyId}/invite-hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Erro ao convidar')
      }
      setMessage({ type: 'success', text: `Convite enviado para ${email}` })
      setEmail('')
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erro' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
      <h3 className="mb-1 text-sm font-medium text-[#cce6f7]">Convidar RH</h3>
      <p className="mb-4 text-xs text-[#5a7fa0]">
        Envie um convite por email para um responsável de RH acessar o dashboard.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          placeholder="rh@empresa.com"
          className="w-64 rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-sm text-[#cce6f7] placeholder-[#5a7fa0]"
        />
        <button
          onClick={handleInvite}
          disabled={loading || !email.trim()}
          className="rounded-lg bg-[#00c9b1] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Convidar'}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}

function CompanyUsersSection({ companyId }: { companyId: string }) {
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/portal/companies/${companyId}/users`)
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [companyId])

  const handleRemove = async (userId: string) => {
    setRemoving(userId)
    try {
      await fetch(`/api/portal/companies/${companyId}/users?userId=${userId}`, {
        method: 'DELETE',
      })
      setUsers((prev) => prev.filter((u) => u.user_id !== userId))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
      <h3 className="mb-1 text-sm font-medium text-[#cce6f7]">
        Usuários com Acesso
      </h3>
      <p className="mb-4 text-xs text-[#5a7fa0]">
        Pessoas vinculadas a esta empresa no dashboard.
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a3a5c] border-t-[#00c9b1]" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-[#5a7fa0]">Nenhum usuário vinculado.</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a3a5c]">
                <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">Email</th>
                <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">Papel</th>
                <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">Desde</th>
                <th className="px-4 py-2 text-right text-xs text-[#5a7fa0]">Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#1a3a5c]/50">
                  <td className="px-4 py-2 text-sm text-[#cce6f7]">
                    {u.email ?? u.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2 text-sm text-[#5a7fa0]">{u.role}</td>
                  <td className="px-4 py-2 text-sm text-[#5a7fa0]">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleRemove(u.user_id)}
                      disabled={removing === u.user_id}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {removing === u.user_id ? '...' : 'Remover'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
