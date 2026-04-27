'use client'

import { Building2, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const DEFAULT_DEPARTMENTS = [
  'RH',
  'Financeiro',
  'Comercial',
  'TI',
  'Operações',
  'Marketing',
  'Jurídico',
  'Diretoria',
  'Logística',
  'Produção',
]

interface DepartmentsSectionProps {
  companyId: string
  departments: string[]
  apiBase: string
  onUpdate: () => void
}

export function DepartmentsSection({
  companyId,
  departments,
  apiBase,
  onUpdate,
}: DepartmentsSectionProps) {
  const [localDepts, setLocalDepts] = useState<string[]>(departments)
  const [customInput, setCustomInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalDepts(departments)
  }, [departments])

  const save = async (updated: string[]) => {
    setLocalDepts(updated)
    setSaving(true)
    try {
      const isB2B = apiBase.includes('/api/brightmonitor')
      if (isB2B) {
        const res = await fetch(`${apiBase}/${companyId}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_departments',
            departments: updated,
          }),
        })
        if (!res.ok) setLocalDepts(departments)
      } else {
        const res = await fetch(`${apiBase}/${companyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ departments: updated }),
        })
        if (!res.ok) setLocalDepts(departments)
      }
    } catch {
      setLocalDepts(departments)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (dept: string) => {
    const updated = localDepts.includes(dept)
      ? localDepts.filter((d) => d !== dept)
      : [...localDepts, dept]
    void save(updated)
  }

  const addCustom = () => {
    const d = customInput.trim()
    if (!d || localDepts.includes(d)) return
    setCustomInput('')
    void save([...localDepts, d])
  }

  const removeCustom = (dept: string) => {
    void save(localDepts.filter((d) => d !== dept))
  }

  const customDepts = localDepts.filter((d) => !DEFAULT_DEPARTMENTS.includes(d))

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] p-5">
      <div className="mb-1 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#14B8A6]" />
        <h3 className="text-[15px] font-semibold text-[#E2E8F0]">
          Departamentos da Empresa
        </h3>
      </div>
      <p className="mb-4 text-[13px] text-[#64748B]">
        Configure os departamentos disponíveis. Estes aparecerão no cadastro e
        na avaliação.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {DEFAULT_DEPARTMENTS.map((dept) => {
          const active = localDepts.includes(dept)
          return (
            <button
              key={dept}
              onClick={() => toggle(dept)}
              disabled={saving}
              className={`rounded-full border px-3 py-1 text-[14px] font-medium transition-colors ${
                active
                  ? 'border-[#14B8A6]/40 bg-[#14B8A6]/15 text-[#14B8A6]'
                  : 'border-[rgba(255,255,255,0.08)] bg-transparent text-[#64748B] hover:border-[rgba(255,255,255,0.15)] hover:text-[#94A3B8]'
              }`}
            >
              {dept}
            </button>
          )
        })}
      </div>

      {customDepts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {customDepts.map((dept) => (
            <span
              key={dept}
              className="flex items-center gap-1.5 rounded-full border border-[#14B8A6]/40 bg-[#14B8A6]/15 px-3 py-1 text-[14px] font-medium text-[#14B8A6]"
            >
              {dept}
              <button
                onClick={() => removeCustom(dept)}
                disabled={saving}
                className="text-[#64748B] hover:text-[#F87171]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Departamento personalizado..."
          className="w-56 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] px-3 py-2 text-[14px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />
        <button
          onClick={addCustom}
          disabled={saving || !customInput.trim()}
          className="flex items-center gap-1 rounded-lg bg-[#0D9488] px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </button>
      </div>
    </div>
  )
}
