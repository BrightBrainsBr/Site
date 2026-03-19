'use client'

import { useB2BCompliance } from '../../hooks/useB2BCompliance'

interface B2BComplianceTabProps {
  companyId: string | null
  cycleId: string | null
}

const CHECKLIST_ITEMS = [
  { id: 'gro-program', label: 'Programa de GRO estruturado e documentado', done: true, status: 'Concluído' },
  { id: 'risk-mapping', label: 'Mapeamento de riscos psicossociais por setor', done: true, status: 'Concluído' },
  { id: 'neuropsych', label: 'Avaliação neuropsicológica aplicada', done: true, status: 'Concluído' },
  { id: 'cfm-laudo', label: 'Laudo CFM emitido e assinado', done: true, status: 'Concluído' },
  { id: 'esocial', label: 'Dados enviados ao eSocial', done: true, status: 'Concluído' },
  { id: 'lgpd', label: 'LGPD: termos de consentimento coletados', done: true, status: 'Concluído' },
  { id: 'risk-report', label: 'Relatório de gestão de riscos entregue', done: true, status: 'Concluído' },
  { id: 'action-plan', label: 'Plano de ação para riscos elevados', done: false, status: 'Em andamento' },
  { id: 'reeval', label: 'Reavaliação semestral agendada', done: false, status: 'Agendado — Jul/2026' },
]

const TIMELINE_ITEMS = [
  { done: true, title: 'Kickoff e cadastro de colaboradores', date: 'Outubro 2025', status: 'Concluído' },
  { done: true, title: 'Aplicação das avaliações neuropsicológicas', date: 'Nov – Dez 2025', status: '100% concluído' },
  { done: true, title: 'Emissão dos relatórios individuais', date: 'Janeiro 2026', status: 'Entregue' },
  { done: true, title: 'GRO consolidado + laudo CFM emitido', date: 'Fevereiro 2026', status: 'Emitido e assinado' },
  { done: true, title: 'Envio ao eSocial e MTE', date: 'Março 2026', status: 'Protocolo registrado' },
  { done: false, title: 'Plano de ação — colaboradores em risco', date: 'Abril 2026', status: 'Em elaboração' },
  { done: false, title: 'Reavaliação semestral (Ciclo 2)', date: 'Julho 2026', status: 'Agendado' },
]

const LEGAL_DOCS = [
  { name: 'GRO – Gestão de Riscos Ocupacionais', info: 'PDF · 48 págs · Emitido 02/2026' },
  { name: 'Laudo CFM 2454/2026', info: 'PDF · Assinado digitalmente' },
  { name: 'Relatório de conformidade NR-1', info: 'PDF · Enviado ao eSocial' },
  { name: 'Certificado LGPD – Bright Brains', info: 'PDF · ISO 27001 certificado' },
]

export function B2BComplianceTab({ companyId, cycleId }: B2BComplianceTabProps) {
  const { data, isLoading } = useB2BCompliance(companyId, cycleId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6] border-t-transparent" />
      </div>
    )
  }

  const coveragePct = data?.coveragePct ?? 0
  const approvedCount = data?.approvedCount ?? 0
  const totalEvaluations = data?.totalEvaluations ?? 0

  return (
    <div className="space-y-4">
      {/* Row 1: 3 status cards — centered layout matching prototype */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* GRO */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-4 py-6 text-center">
          <p className="mb-2 text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Status GRO</p>
          <p className="text-[48px] font-bold leading-none text-[#34D399]">✓</p>
          <p className="mt-1 text-[18px] font-bold text-[#34D399]">GRO Emitido</p>
          <p className="mt-1.5 text-[12px] text-[#64748B]">
            Documento assinado digitalmente<br />Validade: 12 meses
          </p>
          <div className="mt-3 rounded-lg border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.08)] px-2 py-2 text-[11px] text-[#34D399]">
            Protocolo eSocial enviado
          </div>
        </div>

        {/* CFM */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-4 py-6 text-center">
          <p className="mb-2 text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Laudo CFM</p>
          <p className="text-[48px] font-bold leading-none text-[#34D399]">✓</p>
          <p className="mt-1 text-[18px] font-bold text-[#34D399]">CFM 2454/2026</p>
          <p className="mt-1.5 text-[12px] text-[#64748B]">
            Conforme resolução CFM<br />Teleavaliação neuropsicológica
          </p>
          <div className="mt-3 rounded-lg border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.08)] px-2 py-2 text-[11px] text-[#34D399]">
            Assinado: Dr. Bright Brains CRM/SP
          </div>
        </div>

        {/* Coverage */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-4 py-6 text-center">
          <p className="mb-2 text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Cobertura</p>
          <p className="text-[48px] font-bold leading-none text-[#14B8A6]">
            {coveragePct}%
          </p>
          <p className="mt-1 text-[18px] font-bold text-[#14B8A6]">Adesão</p>
          <p className="mt-1.5 text-[12px] text-[#64748B]">
            {approvedCount} de {totalEvaluations} colaboradores<br />elegíveis avaliados
          </p>
          <div className="mt-3 rounded-lg border border-[rgba(13,148,136,0.2)] bg-[rgba(13,148,136,0.08)] px-2 py-2 text-[11px] text-[#14B8A6]">
            MTE aceita ≥75% como conforme
          </div>
        </div>
      </div>

      {/* Row 2: Checklist + Timeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Checklist */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-4 text-[13px] font-semibold text-[#E2E8F0]">
            Checklist de Conformidade NR-1
          </h3>
          <div>
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 border-b border-[rgba(255,255,255,0.08)] py-2.5 last:border-0"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                    item.done
                      ? 'bg-[rgba(16,185,129,0.2)] text-[#34D399]'
                      : 'bg-[rgba(245,158,11,0.2)] text-[#FBBF24]'
                  }`}
                >
                  {item.done ? '✓' : '◐'}
                </div>
                <span className="flex-1 text-[13px] text-[#E2E8F0]">{item.label}</span>
                <span
                  className={`rounded-xl px-2 py-0.5 text-[11px] ${
                    item.done
                      ? 'bg-[rgba(16,185,129,0.1)] text-[#34D399]'
                      : 'bg-[rgba(245,158,11,0.1)] text-[#FBBF24]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline + Legal Docs */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-4">
          <h3 className="mb-4 text-[13px] font-semibold text-[#E2E8F0]">
            Timeline do Ciclo NR-1
          </h3>
          <div className="space-y-0">
            {TIMELINE_ITEMS.map((item, i) => (
              <div key={i} className="flex gap-3 pb-3.5 last:pb-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.done
                        ? 'bg-[#10B981]'
                        : 'bg-[rgba(255,255,255,0.08)]'
                    }`}
                    style={!item.done ? { boxShadow: '0 0 6px rgba(245,158,11,0.5)', background: '#F59E0B' } : undefined}
                  />
                  {i < TIMELINE_ITEMS.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-[rgba(255,255,255,0.08)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#E2E8F0]">{item.title}</p>
                  <p className="text-[12px] text-[#94A3B8]">
                    {item.date} ·{' '}
                    <span style={{ color: item.done ? '#34D399' : '#FBBF24' }}>
                      {item.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-[rgba(255,255,255,0.08)] pt-4">
            <h3 className="mb-3 text-[13px] font-semibold text-[#E2E8F0]">
              Documentação Legal
            </h3>
            {LEGAL_DOCS.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] py-2 text-[12px] last:border-0"
              >
                <span className="text-[#E2E8F0]">📄 {doc.name}</span>
                <span className="text-[11px] text-[#64748B]">{doc.info}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
