// frontend/features/portal/components/CompanyCodeGeneratorComponent.tsx

'use client'

import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface CodeRow {
  id: string
  code: string
  department: string
  employee_email?: string | null
  shareable_url?: string
  used_at?: string | null
}

interface CompanyCodeGeneratorComponentProps {
  companyId: string
}

export function CompanyCodeGeneratorComponent({
  companyId,
}: CompanyCodeGeneratorComponentProps) {
  const queryClient = useQueryClient()
  const [department, setDepartment] = useState('')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codes, setCodes] = useState<CodeRow[]>([])
  const [showCodes, setShowCodes] = useState(false)

  const fetchCodes = useCallback(async (): Promise<CodeRow[]> => {
    const res = await fetch(`/api/portal/companies/${companyId}/codes`)
    if (!res.ok) throw new Error('Failed to fetch codes')
    const { codes: data } = await res.json()
    return data ?? []
  }, [companyId])

  const { data: existingCodes = [], refetch } = useQuery({
    queryKey: ['portal', 'companies', companyId, 'codes'],
    queryFn: fetchCodes,
  })

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setError(null)
    setCodes([])
    try {
      const res = await fetch(`/api/portal/companies/${companyId}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.trim() || 'Geral',
          count: Math.max(1, Math.min(100, count)),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'Erro ao gerar códigos')
      }
      const { codes: newCodes } = await res.json()
      setCodes(newCodes)
      setShowCodes(true)
      await refetch()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar')
    } finally {
      setGenerating(false)
    }
  }, [companyId, department, count, refetch])

  const handleExportCsv = useCallback(() => {
    window.open(
      `/api/portal/companies/${companyId}/codes?format=csv`,
      '_blank'
    )
  }, [companyId])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
        <h3 className="mb-4 text-sm font-medium text-[#cce6f7]">
          Gerar códigos de acesso
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-[#5a7fa0]">
              Departamento
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Engenharia"
              className="w-48 rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#5a7fa0]">
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              className="w-24 rounded-lg border border-[#1a3a5c] bg-[#060e1a] px-4 py-2 text-[#cce6f7]"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-[#00c9b1] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            {generating ? 'Gerando...' : 'Gerar'}
          </button>
          <button
            onClick={handleExportCsv}
            className="rounded-lg border border-[#1a3a5c] px-4 py-2 text-sm text-[#cce6f7] hover:bg-[#0c1a2e]"
          >
            Exportar CSV
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>

      {showCodes && codes.length > 0 && (
        <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
          <h3 className="mb-4 text-sm font-medium text-[#cce6f7]">
            Códigos gerados
          </h3>
          <div className="max-h-96 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a3a5c]">
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    Código
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-[#1a3a5c]/50">
                    <td className="px-4 py-2 font-mono text-[#cce6f7]">
                      {c.code}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={c.shareable_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#00c9b1] hover:underline"
                      >
                        {c.shareable_url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {existingCodes.length > 0 && (
        <div className="rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-6">
          <h3 className="mb-4 text-sm font-medium text-[#cce6f7]">
            Códigos existentes
          </h3>
          <div className="max-h-64 overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a3a5c]">
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    Código
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    Dept
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    URL
                  </th>
                  <th className="px-4 py-2 text-left text-xs text-[#5a7fa0]">
                    Usado
                  </th>
                </tr>
              </thead>
              <tbody>
                {existingCodes.slice(0, 20).map((c) => (
                  <tr key={c.id} className="border-b border-[#1a3a5c]/50">
                    <td className="px-4 py-2 font-mono text-[#cce6f7]">
                      {c.code}
                    </td>
                    <td className="px-4 py-2 text-[#5a7fa0]">
                      {c.department ?? '–'}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={c.shareable_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#00c9b1] hover:underline"
                      >
                        Link
                      </a>
                    </td>
                    <td className="px-4 py-2 text-[#5a7fa0]">
                      {c.used_at ? 'Sim' : 'Não'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {existingCodes.length > 20 && (
            <p className="mt-2 text-xs text-[#5a7fa0]">
              Mostrando 20 de {existingCodes.length}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
