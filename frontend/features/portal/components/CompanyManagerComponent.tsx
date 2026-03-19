// frontend/features/portal/components/CompanyManagerComponent.tsx

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface Company {
  id: string
  name: string
  cnpj: string | null
  contact_email: string | null
  active: boolean
  gro_issued_at: string | null
  gro_valid_until: string | null
  created_at: string
}

async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch('/api/portal/companies')
  if (!res.ok) throw new Error('Failed to fetch companies')
  const { companies } = await res.json()
  return companies
}

interface CompanyManagerComponentProps {
  showCreate?: boolean
  onCreateDone?: () => void
}

export function CompanyManagerComponent({
  showCreate = false,
  onCreateDone,
}: CompanyManagerComponentProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'pt-BR'
  const queryClient = useQueryClient()

  const [newName, setNewName] = useState('')
  const [newCnpj, setNewCnpj] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: companies, isLoading } = useQuery({
    queryKey: ['portal', 'companies'],
    queryFn: fetchCompanies,
  })

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          cnpj: newCnpj.trim() || undefined,
          contact_email: newEmail.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'Erro ao criar empresa')
      }
      await queryClient.invalidateQueries({ queryKey: ['portal', 'companies'] })
      onCreateDone?.()
      setNewName('')
      setNewCnpj('')
      setNewEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar')
    } finally {
      setCreating(false)
    }
  }, [newName, newCnpj, newEmail, queryClient])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00c9b1] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCreate && (
        <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
          <h3 className="mb-4 text-sm font-medium text-[#cce6f7]">
            Criar empresa
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-[#5a7fa0]">Nome</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da empresa"
                className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#5a7fa0]">CNPJ</label>
              <input
                value={newCnpj}
                onChange={(e) => setNewCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#5a7fa0]">E-mail</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
              />
            </div>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="mt-4 rounded-lg bg-[#0090ff] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Criar'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#1a3a5c]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a3a5c]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                CNPJ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                E-mail
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[#5a7fa0]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {(companies ?? []).map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-[#1a3a5c]/50 hover:bg-[#0c1a2e]/50"
                onClick={() => router.push(`/${locale}/portal/empresas/${c.id}`)}
              >
                <td className="px-4 py-3 text-[#cce6f7]">{c.name}</td>
                <td className="px-4 py-3 text-[#5a7fa0]">{c.cnpj ?? '–'}</td>
                <td className="px-4 py-3 text-[#5a7fa0]">
                  {c.contact_email ?? '–'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.active
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }
                  >
                    {c.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/${locale}/portal/empresas/${c.id}`)
                    }}
                    className="text-sm text-[#00c9b1] hover:underline"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(companies ?? []).length === 0 && (
          <p className="py-8 text-center text-[#5a7fa0]">
            Nenhuma empresa cadastrada.
          </p>
        )}
      </div>
    </div>
  )
}
