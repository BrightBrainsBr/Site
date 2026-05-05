// frontend/features/b2b-dashboard/components/tabs/B2BActionPlanTab.tsx

'use client'

import { useCallback, useMemo, useState } from 'react'

import type {
  ActionPlanPriority,
  ActionPlanStatus,
  B2BActionPlan,
  CreateActionPlanInput,
} from '../../b2b-dashboard.interface'
import { useB2BActionPlansMutationHook } from '../../hooks/useB2BActionPlansMutationHook'
import { useB2BActionPlansQueryHook } from '../../hooks/useB2BActionPlansQueryHook'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'

const STATUS_CONFIG: Record<
  ActionPlanStatus,
  { label: string; color: string; bg: string }
> = {
  pendente: {
    label: 'Pendente',
    color: '#F87171',
    bg: 'rgba(239,68,68,0.15)',
  },
  em_andamento: {
    label: 'Em Andamento',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
  },
  agendado: {
    label: 'Agendado',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.15)',
  },
  concluido: {
    label: 'Concluído',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
  },
}

const PRIORITY_CONFIG: Record<
  ActionPlanPriority,
  { label: string; color: string; bg: string }
> = {
  critica: {
    label: 'Crítica',
    color: '#F87171',
    bg: 'rgba(239,68,68,0.15)',
  },
  alta: { label: 'Alta', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  media: { label: 'Média', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  baixa: { label: 'Baixa', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
}

const EMPTY_FORM: CreateActionPlanInput = {
  description: '',
  department: '',
  priority: 'media',
  status: 'pendente',
  responsible: '',
  deadline: '',
  notes: '',
}

interface B2BActionPlanTabProps {
  companyId: string | null
  cycleId: string | null
}

export function B2BActionPlanTab({
  companyId,
  cycleId,
}: B2BActionPlanTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSource, setFilterSource] = useState<'all' | 'ai' | 'manual'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateActionPlanInput>({ ...EMPTY_FORM })
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showGenerateWarning, setShowGenerateWarning] = useState(false)

  const { data: deptData } = useB2BDepartments(companyId, cycleId)
  const { data: plans, isLoading } = useB2BActionPlansQueryHook(companyId, {
    status: filterStatus || undefined,
    cycle: cycleId ?? undefined,
    ai_generated:
      filterSource === 'ai'
        ? 'true'
        : filterSource === 'manual'
          ? 'false'
          : undefined,
  })
  const {
    createPlan,
    updatePlan,
    deletePlan,
    acceptPlan,
    rejectPlan,
    acceptAllAIPending,
    rejectAllAIPending,
    generatePlans,
  } = useB2BActionPlansMutationHook(companyId, cycleId)

  const departments = deptData?.departments ?? []
  const allItems = plans ?? []

  const pendingAIPlans = useMemo(
    () => allItems.filter((p) => p.ai_review_pending),
    [allItems]
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allItems.filter((p) => {
      if (!q) return true
      return (
        p.description.toLowerCase().includes(q) ||
        (p.department ?? '').toLowerCase().includes(q) ||
        (p.responsible ?? '').toLowerCase().includes(q)
      )
    })
  }, [allItems, searchQuery])

  const statusCounts = useMemo(
    () =>
      allItems.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    [allItems]
  )

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    setEditingId(null)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!form.description.trim()) return
    if (editingId) {
      updatePlan.mutate(
        { planId: editingId, ...form },
        { onSuccess: resetForm }
      )
    } else {
      createPlan.mutate(form, { onSuccess: resetForm })
    }
  }, [form, editingId, updatePlan, createPlan, resetForm])

  const handleEdit = useCallback((plan: B2BActionPlan) => {
    setForm({
      description: plan.description,
      department: plan.department ?? '',
      priority: plan.priority,
      status: plan.status,
      responsible: plan.responsible ?? '',
      deadline: plan.deadline ?? '',
      notes: plan.notes ?? '',
    })
    setEditingId(plan.id)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(
    (planId: string) => {
      if (!confirm('Tem certeza que deseja excluir esta ação?')) return
      deletePlan.mutate(planId)
    },
    [deletePlan]
  )

  const triggerGenerate = useCallback(() => {
    setGenerateError(null)
    setShowGenerateWarning(false)
    generatePlans.mutate(
      {},
      {
        onError: (err) => {
          setGenerateError(err.message || 'Erro ao gerar plano de ação com IA')
        },
      }
    )
  }, [generatePlans])

  const handleGenerateClick = useCallback(() => {
    if (pendingAIPlans.length > 0) {
      setShowGenerateWarning(true)
      return
    }
    triggerGenerate()
  }, [pendingAIPlans.length, triggerGenerate])

  const handleAcceptAll = useCallback(() => {
    const ids = pendingAIPlans.map((p) => p.id)
    if (ids.length === 0) return
    acceptAllAIPending.mutate(ids)
  }, [pendingAIPlans, acceptAllAIPending])

  const handleRejectAll = useCallback(() => {
    if (
      !confirm(
        `Tem certeza que deseja remover todas as ${pendingAIPlans.length} ações geradas pela IA?`
      )
    )
      return
    const ids = pendingAIPlans.map((p) => p.id)
    rejectAllAIPending.mutate(ids)
  }, [pendingAIPlans, rejectAllAIPending])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[15px] text-[#64748b]">
        Carregando plano de ação…
      </div>
    )
  }

  const isBulkPending =
    acceptAllAIPending.isPending || rejectAllAIPending.isPending

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🔄</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">
            Plano de Ação (PDCA)
          </h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Ref. NR-1: 1.5.5.2 — Medidas de prevenção com responsáveis, prazos e
          status
        </p>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          Object.entries(STATUS_CONFIG) as [
            ActionPlanStatus,
            (typeof STATUS_CONFIG)[ActionPlanStatus],
          ][]
        ).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() =>
              setFilterStatus((prev) => (prev === key ? '' : key))
            }
            className={`rounded-[14px] border p-3 text-left transition-colors ${
              filterStatus === key
                ? 'border-[rgba(255,255,255,0.2)] bg-[#0c1425]'
                : 'border-[rgba(255,255,255,0.06)] bg-[#0c1425] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <span className="text-[14px] font-medium text-[#94a3b8]">
              {cfg.label}
            </span>
            <p
              className="mt-1 text-[26px] font-bold"
              style={{ color: cfg.color }}
            >
              {statusCounts[key] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* ── AI Review Panel ── */}
      {pendingAIPlans.length > 0 && (
        <div className="rounded-[14px] border border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.06)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(96,165,250,0.2)] text-[12px]">
                ✨
              </span>
              <div>
                <p className="text-[14px] font-semibold text-[#60A5FA]">
                  {pendingAIPlans.length}{' '}
                  {pendingAIPlans.length === 1
                    ? 'ação gerada pela IA aguarda revisão'
                    : 'ações geradas pela IA aguardam revisão'}
                </p>
                <p className="text-[12px] text-[#60A5FA]/60">
                  Revise cada sugestão e aceite ou rejeite individualmente, ou
                  use as ações em lote abaixo.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={handleAcceptAll}
                disabled={isBulkPending}
                className="rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-3 py-1.5 text-[13px] font-semibold text-[#22c55e] transition-colors hover:bg-[rgba(34,197,94,0.2)] disabled:opacity-50"
              >
                {acceptAllAIPending.isPending ? 'Aceitando…' : '✓ Aceitar Todas'}
              </button>
              <button
                onClick={handleRejectAll}
                disabled={isBulkPending}
                className="rounded-lg border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-1.5 text-[13px] font-semibold text-[#F87171] transition-colors hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-50"
              >
                {rejectAllAIPending.isPending ? 'Rejeitando…' : '✕ Rejeitar Todas'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {pendingAIPlans.map((plan) => {
              const pCfg = PRIORITY_CONFIG[plan.priority]
              return (
                <div
                  key={plan.id}
                  className="rounded-[10px] border border-[rgba(96,165,250,0.15)] bg-[#0a1020] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold"
                      style={{ color: pCfg.color, backgroundColor: pCfg.bg }}
                    >
                      {pCfg.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#e2e8f0]">
                        {plan.description}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[#64748b]">
                        {plan.department && <span>{plan.department}</span>}
                        {plan.responsible && (
                          <span>Resp: {plan.responsible}</span>
                        )}
                        {plan.deadline && (
                          <span>
                            Prazo:{' '}
                            {new Date(plan.deadline).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => acceptPlan.mutate(plan.id)}
                        disabled={acceptPlan.isPending || rejectPlan.isPending}
                        title="Aceitar esta ação"
                        className="flex items-center gap-1 rounded-lg border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-2.5 py-1 text-[12px] font-semibold text-[#22c55e] transition-colors hover:bg-[rgba(34,197,94,0.2)] disabled:opacity-50"
                      >
                        ✓ Aceitar
                      </button>
                      <button
                        onClick={() => rejectPlan.mutate(plan.id)}
                        disabled={acceptPlan.isPending || rejectPlan.isPending}
                        title="Rejeitar esta ação"
                        className="flex items-center gap-1 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] px-2.5 py-1 text-[12px] font-semibold text-[#F87171] transition-colors hover:bg-[rgba(239,68,68,0.15)] disabled:opacity-50"
                      >
                        ✕ Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Generate-again warning modal ── */}
      {showGenerateWarning && (
        <div className="rounded-[14px] border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)] p-4">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-[#F59E0B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[#F59E0B]">
                Existem {pendingAIPlans.length} ações geradas pela IA aguardando
                revisão
              </p>
              <p className="mt-0.5 text-[13px] text-[#F59E0B]/70">
                Gerar novamente irá adicionar mais sugestões sem apagar as
                existentes. Deseja continuar?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={triggerGenerate}
                  className="rounded-lg bg-[rgba(245,158,11,0.2)] px-3 py-1.5 text-[13px] font-semibold text-[#F59E0B] transition-colors hover:bg-[rgba(245,158,11,0.3)]"
                >
                  Gerar assim mesmo
                </button>
                <button
                  onClick={() => setShowGenerateWarning(false)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[13px] font-semibold text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar: search + filters on left, buttons on right ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex min-w-[180px] flex-1 items-center">
          <svg
            className="absolute left-2.5 h-3.5 w-3.5 text-[#64748b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ações…"
            className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] py-1.5 pl-8 pr-3 text-[13px] text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[rgba(197,225,85,0.3)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-[#64748b] hover:text-[#94a3b8]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Source filter */}
        <select
          value={filterSource}
          onChange={(e) =>
            setFilterSource(e.target.value as 'all' | 'ai' | 'manual')
          }
          className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0c1425] px-3 py-1.5 text-[13px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
        >
          <option value="all">Todas as origens</option>
          <option value="ai">✨ Gerado pela IA</option>
          <option value="manual">👤 Criado manualmente</option>
        </select>

        {/* Action buttons — right-aligned */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleGenerateClick}
            disabled={generatePlans.isPending}
            className="rounded-lg border border-[rgba(96,165,250,0.3)] bg-[rgba(96,165,250,0.1)] px-4 py-2 text-[13px] font-semibold text-[#60A5FA] transition-colors hover:bg-[rgba(96,165,250,0.2)] disabled:opacity-50"
          >
            {generatePlans.isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Gerando com IA…
              </span>
            ) : (
              '✨ Gerar com IA'
            )}
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="rounded-lg bg-[#c5e155] px-4 py-2 text-[13px] font-semibold text-[#060d1a] transition-colors hover:bg-[#d4ee6b]"
          >
            + Nova Ação
          </button>
        </div>
      </div>

      {/* Generation progress */}
      {generatePlans.isPending && (
        <div className="rounded-xl border border-[rgba(96,165,250,0.25)] bg-[rgba(96,165,250,0.06)] px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-[#60A5FA]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-[14px] font-semibold text-[#60A5FA]">
              Gerando plano de ação com IA…
            </span>
          </div>
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[rgba(96,165,250,0.15)]">
            <div
              className="h-full animate-pulse rounded-full bg-[#60A5FA]"
              style={{ width: '60%' }}
            />
          </div>
          <div className="space-y-1 text-[13px] text-[#64748b]">
            <div className="flex items-center gap-2">
              <svg
                className="h-3 w-3 text-[#4ADE80]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Carregando dados GRO psicossocial
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-3 w-3 animate-spin text-[#60A5FA]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analisando riscos e gerando planos com Claude
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
              Salvando planos no banco de dados
            </div>
          </div>
        </div>
      )}

      {generateError && (
        <div className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] px-4 py-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[#F87171]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-[14px] font-semibold text-[#F87171]">
                Falha na geração de planos
              </p>
              <p className="mt-0.5 text-[13px] text-[#F87171]/80">
                {generateError}
              </p>
              <button
                onClick={triggerGenerate}
                className="mt-2 rounded-lg border border-[rgba(239,68,68,0.3)] px-3 py-1 text-[13px] font-medium text-[#F87171] transition-colors hover:bg-[rgba(239,68,68,0.1)]"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
          <h3 className="mb-3 text-[17px] font-semibold text-[#e2e8f0]">
            {editingId ? 'Editar Ação' : 'Nova Ação'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Departamento
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              >
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Prioridade
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priority: e.target.value as ActionPlanPriority,
                  }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              >
                {(
                  Object.entries(PRIORITY_CONFIG) as [
                    ActionPlanPriority,
                    (typeof PRIORITY_CONFIG)[ActionPlanPriority],
                  ][]
                ).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Responsável
              </label>
              <input
                type="text"
                value={form.responsible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsible: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Prazo
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            {editingId && (
              <div>
                <label className="mb-1 block text-[13px] text-[#64748b]">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as ActionPlanStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
                >
                  {(
                    Object.entries(STATUS_CONFIG) as [
                      ActionPlanStatus,
                      (typeof STATUS_CONFIG)[ActionPlanStatus],
                    ][]
                  ).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-[13px] text-[#64748b]">
                Observações
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-2 text-[13px] font-semibold text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createPlan.isPending || updatePlan.isPending}
              className="rounded-lg bg-[#c5e155] px-4 py-2 text-[13px] font-semibold text-[#060d1a] transition-colors hover:bg-[#d4ee6b] disabled:opacity-50"
            >
              {createPlan.isPending || updatePlan.isPending
                ? 'Salvando…'
                : editingId
                  ? 'Salvar'
                  : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {(filterStatus || filterSource !== 'all' || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-[#64748b]">Filtros ativos:</span>
          {filterStatus && (
            <button
              onClick={() => setFilterStatus('')}
              className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#0c1425] px-2.5 py-0.5 text-[#94a3b8] hover:text-[#e2e8f0]"
            >
              {STATUS_CONFIG[filterStatus as ActionPlanStatus]?.label ?? filterStatus}{' '}
              <span className="text-[10px]">✕</span>
            </button>
          )}
          {filterSource !== 'all' && (
            <button
              onClick={() => setFilterSource('all')}
              className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#0c1425] px-2.5 py-0.5 text-[#94a3b8] hover:text-[#e2e8f0]"
            >
              {filterSource === 'ai' ? '✨ IA' : '👤 Manual'}{' '}
              <span className="text-[10px]">✕</span>
            </button>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.1)] bg-[#0c1425] px-2.5 py-0.5 text-[#94a3b8] hover:text-[#e2e8f0]"
            >
              &ldquo;{searchQuery}&rdquo;{' '}
              <span className="text-[10px]">✕</span>
            </button>
          )}
          <button
            onClick={() => {
              setFilterStatus('')
              setFilterSource('all')
              setSearchQuery('')
            }}
            className="text-[#64748b] underline hover:text-[#94a3b8]"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Action list */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-[15px] text-[#64748b]">
            {searchQuery || filterStatus || filterSource !== 'all'
              ? 'Nenhuma ação encontrada para os filtros selecionados'
              : 'Nenhuma ação cadastrada'}
          </div>
        ) : (
          filteredItems.map((plan) => {
            const pCfg = PRIORITY_CONFIG[plan.priority]
            const sCfg = STATUS_CONFIG[plan.status]
            return (
              <div
                key={plan.id}
                className={`rounded-[14px] border bg-[#0c1425] px-4 py-3 ${
                  plan.ai_review_pending
                    ? 'border-[rgba(96,165,250,0.2)]'
                    : 'border-[rgba(255,255,255,0.06)]'
                }`}
              >
                <div className="flex flex-wrap items-start gap-2">
                  {/* Priority badge */}
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold"
                    style={{ color: pCfg.color, backgroundColor: pCfg.bg }}
                  >
                    {pCfg.label}
                  </span>
                  {plan.ai_generated && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                        plan.ai_review_pending
                          ? 'bg-[rgba(96,165,250,0.2)] text-[#60A5FA]'
                          : 'bg-[rgba(96,165,250,0.1)] text-[#60A5FA]/70'
                      }`}
                    >
                      {plan.ai_review_pending ? '✨ IA · Pendente revisão' : '✨ IA'}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#e2e8f0]">
                      {plan.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-[#64748b]">
                      {plan.department && <span>{plan.department}</span>}
                      {plan.responsible && (
                        <span>Resp: {plan.responsible}</span>
                      )}
                      {plan.deadline && (
                        <span>
                          Prazo:{' '}
                          {new Date(plan.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold"
                    style={{ color: sCfg.color, backgroundColor: sCfg.bg }}
                  >
                    {sCfg.label}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="rounded p-1 text-[#64748b] transition-colors hover:text-[#e2e8f0]"
                      title="Editar"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="rounded p-1 text-[#64748b] transition-colors hover:text-[#F87171]"
                      title="Excluir"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
