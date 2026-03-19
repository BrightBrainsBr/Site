'use client'

import { useCallback, useRef, useState } from 'react'

interface B2BReportsTabProps {
  companyId?: string | null
  cycleId?: string | null
}

const REGULATORY_REPORTS = [
  {
    title: 'GRO Consolidado',
    description: 'Gerenciamento de Riscos Ocupacionais — documento completo com todos os fatores psicossociais identificados.',
    icon: '📋',
  },
  {
    title: 'Relatório Executivo',
    description: 'Resumo executivo para a diretoria com indicadores-chave e recomendações prioritárias.',
    icon: '📊',
  },
  {
    title: 'Relatório por Departamento',
    description: 'Análise detalhada por área organizacional com scores e distribuição de risco.',
    icon: '🏢',
  },
  {
    title: 'Laudo Técnico CFM 2454/2026',
    description: 'Laudo técnico conforme resolução CFM para avaliação de saúde mental ocupacional.',
    icon: '⚕️',
  },
  {
    title: 'CIAT — Comunicação Individual',
    description: 'Comunicação Individual de Acompanhamento Terapêutico para casos críticos identificados.',
    icon: '🔒',
  },
]

const DATA_EXPORTS = [
  {
    title: 'Export Excel — Todos os registros',
    description: 'Planilha completa com todas as avaliações e scores.',
    format: 'CSV',
    endpoint: 'all',
  },
  {
    title: 'Export por Departamento',
    description: 'Dados segmentados por departamento em formato tabular.',
    format: 'CSV',
    endpoint: 'departments',
  },
  {
    title: 'Export JSON — Formato Dashboard',
    description: 'Dados estruturados compatíveis com reimportação no BrightPrecision.',
    format: 'JSON',
    endpoint: 'json',
  },
  {
    title: 'Plano de Ação (PA-GRO)',
    description: 'Plano de ação do GRO com medidas, responsáveis e prazos.',
    format: 'CSV',
    endpoint: 'action-plan',
  },
]

const ESOCIAL_EVENTS = [
  { event: 'S-2240', description: 'Condições Ambientais do Trabalho', status: 'Enviado', date: '15/01/2026' },
  { event: 'S-2220', description: 'Monitoramento da Saúde do Trabalhador', status: 'Pendente', date: '—' },
  { event: 'S-2210', description: 'Comunicação de Acidente de Trabalho', status: 'N/A', date: '—' },
]

const NR1_REVIEW = [
  { item: 'Avaliação Psicossocial', frequency: 'Semestral', nextDate: 'Jul/2026', status: 'Em dia' },
  { item: 'Relatório GRO', frequency: 'Anual', nextDate: 'Jan/2027', status: 'Em dia' },
  { item: 'Treinamento NR-1', frequency: 'Anual', nextDate: 'Mar/2027', status: 'Em dia' },
  { item: 'Reavaliação Críticos', frequency: 'Trimestral', nextDate: 'Abr/2026', status: 'Próximo' },
]

export function B2BReportsTab({ companyId, cycleId }: B2BReportsTabProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    alert(msg)
  }

  const handleGeneratePdf = (title: string) => {
    showToast(`"${title}" — Geração de PDF em construção. Em breve disponível.`)
  }

  const handleExport = (exp: (typeof DATA_EXPORTS)[number]) => {
    if (!companyId) {
      showToast('Empresa não identificada.')
      return
    }
    const baseUrl = `/api/b2b/${companyId}/overview`
    const params = new URLSearchParams()
    if (cycleId) params.set('cycle', cycleId)
    params.set('export', exp.endpoint)
    params.set('format', exp.format.toLowerCase())

    showToast(`"${exp.title}" — Exportação em construção. Em breve disponível.`)
  }

  const handleImport = useCallback(
    async (file: File) => {
      if (!companyId) return
      setImporting(true)
      setImportStatus(null)
      try {
        const text = await file.text()
        const json = JSON.parse(text)

        const res = await fetch(`/api/b2b/${companyId}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: json, cycleId }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Erro na importação')
        }

        const result = await res.json()
        setImportStatus({
          type: 'success',
          text: `Importação concluída: ${result.imported ?? 0} registros processados.`,
        })
      } catch (e) {
        setImportStatus({
          type: 'error',
          text: e instanceof Error ? e.message : 'Erro ao importar arquivo',
        })
      } finally {
        setImporting(false)
      }
    },
    [companyId, cycleId]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.json')) {
      void handleImport(file)
    } else {
      setImportStatus({ type: 'error', text: 'Apenas arquivos .json são aceitos.' })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleImport(file)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left column */}
      <div className="space-y-6">
        {/* Regulatory Reports */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-6">
          <h3 className="mb-1 text-[14px] font-semibold text-[#E2E8F0]">
            Relatórios Regulatórios
          </h3>
          <p className="mb-4 text-[11px] text-[#64748B]">
            Documentos oficiais para conformidade NR-1 e legislação trabalhista.
          </p>
          <div className="space-y-3">
            {REGULATORY_REPORTS.map((r) => (
              <div
                key={r.title}
                className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0A1628] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{r.icon}</span>
                  <div>
                    <p className="text-[13px] font-medium text-[#E2E8F0]">{r.title}</p>
                    <p className="text-[11px] text-[#64748B]">{r.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleGeneratePdf(r.title)}
                  className="shrink-0 rounded-lg bg-[rgba(20,184,166,0.15)] px-3 py-1.5 text-[11px] font-semibold text-[#14B8A6] transition-colors hover:bg-[rgba(20,184,166,0.25)]"
                >
                  Gerar PDF
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Exports */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-6">
          <h3 className="mb-1 text-[14px] font-semibold text-[#E2E8F0]">
            Exportação de Dados
          </h3>
          <p className="mb-4 text-[11px] text-[#64748B]">
            Baixe dados em diferentes formatos para análise externa ou backup.
          </p>
          <div className="space-y-3">
            {DATA_EXPORTS.map((exp) => (
              <div
                key={exp.title}
                className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0A1628] px-4 py-3"
              >
                <div>
                  <p className="text-[13px] font-medium text-[#E2E8F0]">{exp.title}</p>
                  <p className="text-[11px] text-[#64748B]">{exp.description}</p>
                </div>
                <button
                  onClick={() => handleExport(exp)}
                  className="shrink-0 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8] transition-colors hover:border-[rgba(255,255,255,0.2)] hover:text-[#E2E8F0]"
                >
                  Download {exp.format}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* JSON Import */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-6">
          <h3 className="mb-1 text-[14px] font-semibold text-[#E2E8F0]">
            Importar Dados
          </h3>
          <p className="mb-4 text-[11px] text-[#64748B]">
            Import JSON do BrightPrecision Assessment para popular o dashboard.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 transition-colors ${
              dragging
                ? 'border-[#14B8A6] bg-[rgba(20,184,166,0.08)]'
                : 'border-[rgba(255,255,255,0.1)] bg-[#0A1628] hover:border-[rgba(255,255,255,0.2)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <svg
              className="mb-2 h-8 w-8 text-[#64748B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[12px] text-[#94A3B8]">
              {importing ? 'Importando...' : 'Arraste o arquivo .json ou clique para selecionar'}
            </p>
          </div>

          {importStatus && (
            <p
              className={`mt-3 text-[12px] ${
                importStatus.type === 'success' ? 'text-[#34D399]' : 'text-[#F87171]'
              }`}
            >
              {importStatus.text}
            </p>
          )}
        </div>

        {/* eSocial Status */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-6">
          <h3 className="mb-1 text-[14px] font-semibold text-[#E2E8F0]">
            eSocial — Status de Eventos
          </h3>
          <p className="mb-4 text-[11px] text-[#64748B]">
            Acompanhamento dos eventos enviados ao sistema eSocial.
          </p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Evento</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Descrição</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Status</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Data</th>
              </tr>
            </thead>
            <tbody>
              {ESOCIAL_EVENTS.map((ev) => (
                <tr key={ev.event} className="border-b border-[rgba(255,255,255,0.04)]">
                  <td className="py-2.5 text-[12px] font-medium text-[#E2E8F0]">{ev.event}</td>
                  <td className="py-2.5 text-[12px] text-[#94A3B8]">{ev.description}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        ev.status === 'Enviado'
                          ? 'bg-[rgba(16,185,129,0.15)] text-[#34D399]'
                          : ev.status === 'Pendente'
                            ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                            : 'bg-[rgba(100,116,139,0.15)] text-[#64748B]'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-[12px] text-[#64748B]">{ev.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NR-1 Review Periodicity */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-6">
          <h3 className="mb-1 text-[14px] font-semibold text-[#E2E8F0]">
            Periodicidade de Revisão NR-1
          </h3>
          <p className="mb-4 text-[11px] text-[#64748B]">
            Calendário de revisões obrigatórias conforme a norma regulamentadora.
          </p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Item</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Frequência</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Próxima</th>
                <th className="py-2 text-left text-[11px] font-medium text-[#64748B]">Status</th>
              </tr>
            </thead>
            <tbody>
              {NR1_REVIEW.map((r) => (
                <tr key={r.item} className="border-b border-[rgba(255,255,255,0.04)]">
                  <td className="py-2.5 text-[12px] font-medium text-[#E2E8F0]">{r.item}</td>
                  <td className="py-2.5 text-[12px] text-[#94A3B8]">{r.frequency}</td>
                  <td className="py-2.5 text-[12px] text-[#94A3B8]">{r.nextDate}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'Em dia'
                          ? 'bg-[rgba(16,185,129,0.15)] text-[#34D399]'
                          : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
