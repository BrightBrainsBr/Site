// frontend/features/b2b-dashboard/components/tabs/B2BReportsTab.tsx

'use client'

import { useState } from 'react'

import type { ReportType } from '../../b2b-dashboard.interface'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { useB2BNR1InventoryMutationHook } from '../../hooks/useB2BNR1InventoryMutationHook'
import { useB2BReportsMutationHook } from '../../hooks/useB2BReportsMutationHook'

interface ReportCardDef {
  type: ReportType
  icon: string
  title: string
  description: string
  badge?: string
}

const REPORT_CARDS: ReportCardDef[] = [
  {
    type: 'gro-consolidado',
    icon: '⚖️',
    title: 'GRO Consolidado',
    description:
      'Relatório completo de Gerenciamento de Riscos Ocupacionais com distribuição de risco, médias por escala clínica, SRQ-20, distribuição por departamento e análise psicossocial.',
    badge: 'PDF',
  },
  {
    type: 'por-departamento',
    icon: '🏢',
    title: 'Relatório por Departamento',
    description:
      'Análise detalhada por área organizacional com scores, distribuição de risco por nível (Crítico / Elevado / Moderado / Baixo) e médias das escalas clínicas por setor.',
    badge: 'PDF',
  },
  {
    type: 'csv-export',
    icon: '📊',
    title: 'Exportação CSV',
    description:
      'Planilha completa com todas as avaliações individuais, departamento, data, nível de risco e scores de cada instrumento (PHQ-9, GAD-7, SRQ-20, PSS-10, MBI, ISI).',
    badge: 'CSV',
  },
]

interface B2BReportsTabProps {
  companyId?: string | null
  cycleId?: string | null
}

export function B2BReportsTab({ companyId, cycleId }: B2BReportsTabProps) {
  const [department, setDepartment] = useState<string>('')
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({})

  const { data: deptData } = useB2BDepartments(companyId ?? null, cycleId)
  const reportsMutation = useB2BReportsMutationHook(companyId ?? null)
  const inventoryMutation = useB2BNR1InventoryMutationHook(companyId ?? null)

  const departments = deptData?.departments ?? []

  const handleDownload = (type: ReportType) => {
    reportsMutation.mutate(
      { type, department: department || undefined, cycleId: cycleId ?? undefined },
      {
        onSuccess: (data) =>
          setLastGenerated((prev) => ({ ...prev, [type]: data.generatedAt })),
      }
    )
  }

  const handleDownloadInventory = () => {
    inventoryMutation.mutate(
      { department: department || undefined, cycleId: cycleId ?? undefined },
      {
        onSuccess: (data) =>
          setLastGenerated((prev) => ({ ...prev, 'nr1-inventario': data.generatedAt })),
      }
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[20px]">📋</span>
          <h2 className="text-[20px] font-bold text-[#e2e8f0]">Relatórios</h2>
        </div>
        <p className="mt-0.5 pl-[28px] text-[15px] text-[#64748b]">
          Geração de relatórios com filtros e download
        </p>
      </div>

      {/* Department filter */}
      <div className="flex items-center gap-3">
        <label className="text-[14px] font-medium text-[#94a3b8]">Filtrar por departamento</label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#111b2e] px-3 py-1.5 text-[14px] text-[#e2e8f0] outline-none focus:border-[rgba(197,225,85,0.3)]"
        >
          <option value="">Todos os departamentos</option>
          {departments.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        {department && (
          <button
            onClick={() => setDepartment('')}
            className="text-[13px] text-[#64748b] hover:text-[#94a3b8]"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Report cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => {
          const isDownloading =
            reportsMutation.isPending && reportsMutation.variables?.type === card.type
          const generatedAt = lastGenerated[card.type]
          return (
            <div
              key={card.type}
              className="flex flex-col rounded-[14px] border border-[rgba(255,255,255,0.06)] bg-[#0c1425] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[22px]">{card.icon}</span>
                <span className="rounded-md bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                  {card.badge}
                </span>
              </div>
              <h3 className="mt-3 text-[17px] font-semibold text-[#e2e8f0]">{card.title}</h3>
              <p className="mt-1.5 flex-1 text-[14px] leading-relaxed text-[#64748b]">
                {card.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleDownload(card.type)}
                  disabled={isDownloading}
                  className="rounded-lg bg-[rgba(197,225,85,0.15)] px-4 py-1.5 text-[14px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)] disabled:opacity-50"
                >
                  {isDownloading ? 'Gerando…' : '↓ Download'}
                </button>
                {generatedAt && (
                  <span className="text-[12px] text-[#64748b]">
                    {new Date(generatedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* NR-1 Inventory — prominent card */}
      <div className="rounded-[14px] border border-[rgba(197,225,85,0.3)] bg-[#0c1425] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[22px]">📑</span>
              <h3 className="text-[17px] font-semibold text-[#c5e155]">Inventário de Riscos NR-1</h3>
            </div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#64748b]">
              Documento oficial de inventário de riscos psicossociais conforme NR-1. Gera PDF
              completo com matriz de risco, distribuição por departamento, plano de ação e
              recomendações baseadas nos dados do ciclo atual.
            </p>
            {lastGenerated['nr1-inventario'] && (
              <p className="mt-1.5 text-[12px] text-[#64748b]">
                Última geração: {new Date(lastGenerated['nr1-inventario']).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <button
            onClick={handleDownloadInventory}
            disabled={inventoryMutation.isPending}
            className="shrink-0 rounded-lg bg-[rgba(197,225,85,0.15)] px-5 py-2 text-[14px] font-semibold text-[#c5e155] transition-colors hover:bg-[rgba(197,225,85,0.25)] disabled:opacity-50"
          >
            {inventoryMutation.isPending ? 'Gerando…' : '↓ Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
