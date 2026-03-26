'use client'

import { Upload, UserPlus } from 'lucide-react'
import { useRef, useState } from 'react'

interface BulkInviteComponentProps {
  companyId: string
  role: 'admin' | 'collaborator'
  departments: string[]
  apiBase: string
  onInvited: () => void
}

export function BulkInviteComponent({
  companyId,
  role,
  departments,
  apiBase,
  onInvited,
}: BulkInviteComponentProps) {
  const [text, setText] = useState('')
  const [department, setDepartment] = useState('')
  const [csvDepartments, setCsvDepartments] = useState<Record<string, string>>(
    {}
  )
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    ok: number
    failed: number
    errors: string[]
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseEmails = (raw: string): string[] => {
    return raw
      .split(/[,\n;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'))
  }

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      if (!content) return

      const lines = content.split('\n').filter((l) => l.trim())
      if (lines.length === 0) return

      const header = lines[0].toLowerCase()
      const hasHeader = header.includes('email') || header.includes('e-mail')
      const dataLines = hasHeader ? lines.slice(1) : lines

      const parsed: Array<{ email: string; dept: string }> = []

      for (const line of dataLines) {
        const cols = line.split(/[,;]/).map((c) => c.trim())
        if (cols[0] && cols[0].includes('@')) {
          parsed.push({ email: cols[0].toLowerCase(), dept: cols[1] ?? '' })
        }
      }

      if (parsed.length) {
        setText((prev) => {
          const existing = prev.trim()
          const newEmails = parsed.map((p) => p.email).join('\n')
          return existing ? `${existing}\n${newEmails}` : newEmails
        })

        const deptMap: Record<string, string> = {}
        for (const p of parsed) {
          if (p.dept) deptMap[p.email] = p.dept
        }
        if (Object.keys(deptMap).length > 0) {
          setCsvDepartments(deptMap)
        }

        const firstDept = parsed.find((p) => p.dept)?.dept
        if (firstDept && !department) setDepartment(firstDept)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleInvite = async () => {
    const emails = parseEmails(text)
    if (!emails.length) return

    setLoading(true)
    setResult(null)

    try {
      const hasCsvDepts = Object.keys(csvDepartments).length > 0
      const res = await fetch(`${apiBase}/${companyId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite_bulk',
          emails,
          role,
          ...(department && role === 'collaborator' ? { department } : {}),
          ...(hasCsvDepts && role === 'collaborator'
            ? { emailDepartments: csvDepartments }
            : {}),
        }),
      })

      if (!res.ok) {
        setResult({
          ok: 0,
          failed: emails.length,
          errors: ['Erro ao processar convites'],
        })
        return
      }

      const data = await res.json()
      const results: Array<{ ok: boolean; error?: string }> = data.results ?? []
      const ok = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok).length
      const errors = results
        .filter((r) => !r.ok)
        .map((r) => r.error ?? 'Erro desconhecido')

      setResult({ ok, failed, errors: Array.from(new Set(errors)) })
      if (ok > 0) {
        setText('')
        setDepartment('')
        setCsvDepartments({})
        onInvited()
      }
    } catch {
      setResult({ ok: 0, failed: 0, errors: ['Erro de conexão'] })
    } finally {
      setLoading(false)
    }
  }

  const emailCount = parseEmails(text).length

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#07111F] p-4">
      <p className="mb-3 text-[11px] text-[#64748B]">
        {role === 'admin'
          ? 'Envie convites por email para administradores acessarem o dashboard.'
          : 'Convide colaboradores para realizarem a avaliação. Aceita email único, múltiplos separados por vírgula/enter, ou CSV.'}
      </p>

      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="email@empresa.com, outro@empresa.com&#10;ou um por linha..."
          rows={3}
          className="w-full resize-none rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[12px] text-[#E2E8F0] placeholder-[#64748B] focus:border-[#14B8A6] focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-2">
          {role === 'collaborator' && departments.length > 0 && (
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[12px] text-[#E2E8F0] focus:border-[#14B8A6] focus:outline-none"
            >
              <option value="">Departamento (opcional)</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0E1E33] px-3 py-2 text-[12px] text-[#94A3B8] transition-colors hover:border-[#14B8A6] hover:text-[#E2E8F0]"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCSV}
            className="hidden"
          />

          <button
            onClick={handleInvite}
            disabled={loading || emailCount === 0}
            className="w-full rounded-lg bg-[#0D9488] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40 sm:ml-auto sm:w-auto"
          >
            {loading
              ? 'Enviando...'
              : `Convidar${emailCount > 0 ? ` (${emailCount})` : ''}`}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-3 space-y-1">
          {result.ok > 0 && (
            <p className="text-[12px] text-[#34D399]">
              {result.ok} convite(s) enviado(s) com sucesso.
            </p>
          )}
          {result.failed > 0 && (
            <p className="text-[12px] text-[#F87171]">
              {result.failed} falha(s): {result.errors.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
