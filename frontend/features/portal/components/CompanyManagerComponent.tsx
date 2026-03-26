// frontend/features/portal/components/CompanyManagerComponent.tsx

'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface Company {
  id: string
  name: string
  cnpj: string | null
  contact_email: string | null
  active: boolean
  admin_emails: string[]
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

  const [searchQuery, setSearchQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [newCnpj, setNewCnpj] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editName, setEditName] = useState('')
  const [editCnpj, setEditCnpj] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  const { data: companies, isLoading } = useQuery({
    queryKey: ['portal', 'companies'],
    queryFn: fetchCompanies,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
  }, [newName, newCnpj, newEmail, queryClient, onCreateDone])

  const handleEditSave = useCallback(async () => {
    if (!editingCompany || !editName.trim()) return
    setEditSaving(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/portal/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          cnpj: editCnpj.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'Erro ao editar')
      }
      await queryClient.invalidateQueries({ queryKey: ['portal', 'companies'] })
      setEditingCompany(null)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setEditSaving(false)
    }
  }, [editingCompany, editName, editCnpj, queryClient])

  const handleDelete = useCallback(async () => {
    if (!deletingCompany) return
    setDeleteLoading(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/portal/companies/${deletingCompany.id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ message: 'Erro ao excluir' }))
        throw new Error(err.message ?? 'Erro ao excluir')
      }
      await queryClient.invalidateQueries({ queryKey: ['portal', 'companies'] })
      setDeletingCompany(null)
      setDeleteConfirmText('')
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Erro ao excluir')
    } finally {
      setDeleteLoading(false)
    }
  }, [deletingCompany, queryClient])

  const filteredCompanies = useMemo(() => {
    const list = companies ?? []
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cnpj && c.cnpj.toLowerCase().includes(q)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(q)) ||
        c.admin_emails.some((e) => e.toLowerCase().includes(q))
    )
  }, [companies, searchQuery])

  function renderAdminEmails(c: Company) {
    const emails = c.admin_emails
    if (!emails.length) return <span className="text-[#5a7fa0]">{c.contact_email ?? '–'}</span>

    const first = emails[0]
    const rest = emails.length - 1
    return (
      <span className="text-[#5a7fa0]">
        {first}
        {rest > 0 && (
          <span className="ml-1.5 inline-flex items-center rounded-full bg-[#1a3a5c] px-1.5 py-0.5 text-[10px] font-medium text-[#94b8d8]">
            +{rest}
          </span>
        )}
      </span>
    )
  }

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
        <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-4 md:p-6">
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
              <label className="mb-1 block text-xs text-[#5a7fa0]">
                E-mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
              />
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="mt-4 rounded-lg bg-[#0090ff] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Criar'}
          </button>
        </div>
      )}

      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a7fa0]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome, CNPJ ou e-mail..."
          className="w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] py-2 pl-10 pr-4 text-sm text-[#cce6f7] placeholder-[#5a7fa0] focus:border-[#00c9b1] focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1a3a5c]">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-[#1a3a5c]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                CNPJ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                Admins
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[#5a7fa0]">
                Status
              </th>
              <th className="w-12 px-4 py-3 text-right text-xs font-medium uppercase text-[#5a7fa0]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-[#1a3a5c]/50 hover:bg-[#0c1a2e]/50"
                onClick={() =>
                  router.push(`/${locale}/portal/empresas/${c.id}`)
                }
              >
                <td className="px-4 py-3 text-[#cce6f7]">{c.name}</td>
                <td className="px-4 py-3 text-[#5a7fa0]">{c.cnpj ?? '–'}</td>
                <td className="px-4 py-3">{renderAdminEmails(c)}</td>
                <td className="px-4 py-3">
                  <span
                    className={c.active ? 'text-green-400' : 'text-amber-400'}
                  >
                    {c.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="relative px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === c.id ? null : c.id)
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5a7fa0] hover:bg-[#1a3a5c] hover:text-[#cce6f7]"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>

                  {menuOpenId === c.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-4 top-full z-20 mt-1 w-40 rounded-lg border border-[#1a3a5c] bg-[#0c1a2e] py-1 shadow-xl"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          setEditingCompany(c)
                          setEditName(c.name)
                          setEditCnpj(c.cnpj ?? '')
                          setActionError(null)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#cce6f7] hover:bg-[#1a3a5c]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          setDeletingCompany(c)
                          setDeleteConfirmText('')
                          setActionError(null)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-[#1a3a5c]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Excluir
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCompanies.length === 0 && (
          <p className="py-8 text-center text-[#5a7fa0]">
            {searchQuery.trim()
              ? 'Nenhuma empresa encontrada.'
              : 'Nenhuma empresa cadastrada.'}
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {editingCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setEditingCompany(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-[#1a3a5c] bg-[#0c1a2e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-[#cce6f7]">
              Editar empresa
            </h3>
            <label className="mb-1 block text-xs text-[#5a7fa0]">Nome</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7] focus:border-[#00c9b1] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              autoFocus
            />
            <label className="mb-1 block text-xs text-[#5a7fa0]">CNPJ</label>
            <input
              value={editCnpj}
              onChange={(e) => setEditCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="mb-4 w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7] focus:border-[#00c9b1] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
            />
            {actionError && (
              <p className="mb-3 text-sm text-red-400">{actionError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingCompany(null)}
                className="rounded-lg px-4 py-2 text-sm text-[#5a7fa0] hover:text-[#cce6f7]"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editName.trim()}
                className="rounded-lg bg-[#00c9b1] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                {editSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setDeletingCompany(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-red-900/50 bg-[#0c1a2e] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-400">
                Excluir empresa
              </h3>
            </div>
            <p className="mb-2 text-sm text-[#94a3b8]">
              Esta ação é <strong className="text-red-400">irreversível</strong>.
              Todos os dados associados serão excluídos permanentemente:
            </p>
            <ul className="mb-4 ml-4 list-disc text-xs text-[#5a7fa0]">
              <li>Ciclos de avaliação</li>
              <li>Administradores vinculados</li>
              <li>Códigos de acesso</li>
              <li>Vínculo com avaliações existentes</li>
            </ul>
            <p className="mb-2 text-sm text-[#94a3b8]">
              Para confirmar, digite{' '}
              <strong className="font-mono text-[#cce6f7]">
                {deletingCompany.name}
              </strong>
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deletingCompany.name}
              className="mb-4 w-full rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7] focus:border-red-500 focus:outline-none"
              autoFocus
            />
            {actionError && (
              <p className="mb-3 text-sm text-red-400">{actionError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingCompany(null)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg px-4 py-2 text-sm text-[#5a7fa0] hover:text-[#cce6f7]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={
                  deleteLoading ||
                  deleteConfirmText !== deletingCompany.name
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-30"
              >
                {deleteLoading ? 'Excluindo...' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
