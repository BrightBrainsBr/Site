// frontend/features/b2b-dashboard/components/tabs/B2BActionPlanTab.tsx

'use client'

import { useCallback, useState } from 'react'

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
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateActionPlanInput>({ ...EMPTY_FORM })

  const { data: deptData } = useB2BDepartments(companyId, cycleId)
  const { data: plans, isLoading } = useB2BActionPlansQueryHook(companyId, {
    status: filterStatus || undefined,
    cycle: cycleId ?? undefined,
  })
  const { createPlan, updatePlan, deletePlan, generatePlans } =
    useB2BActionPlansMutationHook(companyId)

  const departments = deptData?.departments ?? []
  const items = plans ?? []

  const statusCounts = items.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
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

  const handleGenerate = useCallback(() => {
    generatePlans.mutate({})
  }, [generatePlans])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-[#64748b]">
        Carregando plano de ação…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[20px]">🔄</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">Plano de Ação (PDCA)</h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[13px] text-[#64748b]">Ref. NR-1: 1.5.5.2 — Medidas de prevenção com responsáveis, prazos e status</p>
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
            <span className="text-[12px] font-medium text-[#94a3b8]">
              {cfg.label}
            </span>
            <p className="mt-1 text-[26px] font-bold" style={{ color: cfg.color }}>
              {statusCounts[key] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="rounded-lg bg-[rgba(197,225,85,0.15)] px-3 py-1.5 text-[12px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)]"
        >
          + Nova Ação
        </button>
        <button
          onClick={handleGenerate}
          disabled={generatePlans.isPending}
          className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[12px] font-semibold text-[#94a3b8] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[#e2e8f0] disabled:opacity-50"
        >
          {generatePlans.isPending ? 'Gerando…' : 'Gerar com IA'}
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-4">
          <h3 className="mb-3 text-[15px] font-semibold text-[#e2e8f0]">
            {editingId ? 'Editar Ação' : 'Nova Ação'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-[11px] text-[#64748b]">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748b]">
                Departamento
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
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
              <label className="mb-1 block text-[11px] text-[#64748b]">
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
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
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
              <label className="mb-1 block text-[11px] text-[#64748b]">
                Responsável
              </label>
              <input
                type="text"
                value={form.responsible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, responsible: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[#64748b]">
                Prazo
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
            {editingId && (
              <div>
                <label className="mb-1 block text-[11px] text-[#64748b]">
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
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
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
              <label className="mb-1 block text-[11px] text-[#64748b]">
                Observações
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111b2e] px-3 py-2 text-[12px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={createPlan.isPending || updatePlan.isPending}
              className="rounded-lg bg-[rgba(197,225,85,0.15)] px-4 py-1.5 text-[12px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)] disabled:opacity-50"
            >
              {createPlan.isPending || updatePlan.isPending
                ? 'Salvando…'
                : editingId
                  ? 'Salvar'
                  : 'Criar'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-[rgba(255,255,255,0.1)] px-4 py-1.5 text-[12px] font-semibold text-[#94a3b8] transition-colors hover:text-[#e2e8f0]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Action list */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] text-[13px] text-[#64748b]">
            Nenhuma ação cadastrada
          </div>
        ) : (
          items.map((plan) => {
            const pCfg = PRIORITY_CONFIG[plan.priority]
            const sCfg = STATUS_CONFIG[plan.status]
            return (
              <div
                key={plan.id}
                className="rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] px-4 py-3"
              >
                <div className="flex flex-wrap items-start gap-2">
                  {/* Priority badge */}
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ color: pCfg.color, backgroundColor: pCfg.bg }}
                  >
                    {pCfg.label}
                  </span>
                  {plan.ai_generated && (
                    <span className="shrink-0 rounded-full bg-[rgba(96,165,250,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[#60A5FA]">
                      IA
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#e2e8f0]">
                      {plan.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#64748b]">
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
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
