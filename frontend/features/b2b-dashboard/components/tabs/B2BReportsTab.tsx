// frontend/features/b2b-dashboard/components/tabs/B2BReportsTab.tsx

'use client'

import { useState } from 'react'

import type {
  B2BReportResponse,
  ReportType,
} from '../../b2b-dashboard.interface'
import { useB2BDepartments } from '../../hooks/useB2BDepartments'
import { useB2BNR1InventoryMutationHook } from '../../hooks/useB2BNR1InventoryMutationHook'
import { useB2BReportsMutationHook } from '../../hooks/useB2BReportsMutationHook'

interface ReportCardDef {
  type: ReportType
  title: string
  description: string
  prominent?: boolean
}

const REPORT_CARDS: ReportCardDef[] = [
  {
    type: 'gro-consolidado',
    title: 'GRO Consolidado PDF',
    description:
      'Gerenciamento de Riscos Ocupacionais — documento completo com todos os fatores psicossociais.',
  },
  {
    type: 'por-departamento',
    title: 'Relatório por Departamento',
    description:
      'Análise detalhada por área organizacional com scores e distribuição de risco.',
  },
  {
    type: 'csv-export',
    title: 'Exportação CSV',
    description:
      'Planilha completa com todas as avaliações e scores para análise externa.',
  },
]

interface B2BReportsTabProps {
  companyId?: string | null
  cycleId?: string | null
}

export function B2BReportsTab({ companyId, cycleId }: B2BReportsTabProps) {
  const [department, setDepartment] = useState<string>('')
  const [results, setResults] = useState<
    Record<string, B2BReportResponse | null>
  >({})

  const { data: deptData } = useB2BDepartments(companyId ?? null, cycleId)
  const reportsMutation = useB2BReportsMutationHook(companyId ?? null)
  const inventoryMutation = useB2BNR1InventoryMutationHook(companyId ?? null)

  const departments = deptData?.departments ?? []

  const handleGenerate = (type: ReportType) => {
    reportsMutation.mutate(
      {
        type,
        department: department || undefined,
        cycleId: cycleId ?? undefined,
      },
      {
        onSuccess: (data) =>
          setResults((prev) => ({ ...prev, [type]: data })),
      }
    )
  }

  const handleGenerateInventory = () => {
    inventoryMutation.mutate(
      {
        department: department || undefined,
        cycleId: cycleId ?? undefined,
      },
      {
        onSuccess: (data) =>
          setResults((prev) => ({ ...prev, 'nr1-inventario': data })),
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <label className="text-[12px] font-medium text-[#94A3B8]">
          Departamento
        </label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0A1628] px-3 py-1.5 text-[12px] text-[#E2E8F0] outline-none focus:border-[#0D9488]"
        >
          <option value="">Todos</option>
          {departments.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((card) => {
          const result = results[card.type]
          const isGenerating =
            reportsMutation.isPending &&
            reportsMutation.variables?.type === card.type
          return (
            <div
              key={card.type}
              className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4"
            >
              <h3 className="text-[14px] font-semibold text-[#E2E8F0]">
                {card.title}
              </h3>
              <p className="mt-1 text-[11px] text-[#64748B]">
                {card.description}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(card.type)}
                  disabled={isGenerating}
                  className="rounded-lg bg-[rgba(20,184,166,0.15)] px-4 py-1.5 text-[12px] font-semibold text-[#14B8A6] transition-colors hover:bg-[rgba(20,184,166,0.25)] disabled:opacity-50"
                >
                  {isGenerating ? 'Gerando…' : 'Gerar'}
                </button>
                {result && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-[#14B8A6] underline underline-offset-2 hover:text-[#2DD4BF]"
                  >
                    Download ({result.filename})
                  </a>
                )}
              </div>
              {result && (
                <p className="mt-2 text-[10px] text-[#64748B]">
                  Gerado em{' '}
                  {new Date(result.generatedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          )
        })}

        {/* NR-1 Inventory — prominent card */}
        <div className="rounded-xl border border-[rgba(20,184,166,0.3)] bg-[#0E1E33] p-4 sm:col-span-2 lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[#14B8A6]">
                Inventário de Riscos NR-1
              </h3>
              <p className="mt-1 text-[11px] text-[#64748B]">
                Documento oficial de inventário de riscos psicossociais
                conforme NR-1. Gera PDF completo com matriz de risco, plano de
                ação e recomendações.
              </p>
              {results['nr1-inventario'] && (
                <p className="mt-1 text-[10px] text-[#64748B]">
                  Última geração:{' '}
                  {new Date(
                    results['nr1-inventario'].generatedAt
                  ).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateInventory}
                disabled={inventoryMutation.isPending}
                className="shrink-0 rounded-lg bg-[rgba(20,184,166,0.15)] px-4 py-2 text-[12px] font-semibold text-[#14B8A6] transition-colors hover:bg-[rgba(20,184,166,0.25)] disabled:opacity-50"
              >
                {inventoryMutation.isPending
                  ? 'Gerando Inventário…'
                  : 'Gerar Inventário'}
              </button>
              {results['nr1-inventario'] && (
                <a
                  href={results['nr1-inventario'].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-[#14B8A6] underline underline-offset-2 hover:text-[#2DD4BF]"
                >
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
