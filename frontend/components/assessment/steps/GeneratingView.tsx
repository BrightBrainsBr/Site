import { useEffect, useRef, useState } from 'react'

import { InfoBox } from '../fields'

interface StageContent {
  stage: number
  content: string
}

const STAGE_LABELS = [
  'Análise Clínica & Diagnósticos',
  'Terapêutica & Neuromodulação',
  'Monitoramento & Conformidade',
]

const REASONING_MESSAGES: Record<number, string[]> = {
  1: [
    'Analisando dados demográficos e perfil clínico...',
    'Correlacionando escalas psicométricas com histórico...',
    'Avaliando padrões de sintomas e comorbidades...',
    'Cruzando dados biométricos com indicadores clínicos...',
    'Construindo hipóteses diagnósticas com CID-10...',
    'Calculando estratificação de risco...',
    'Analisando fatores de proteção e vulnerabilidade...',
    'Refinando análise integrativa dos dados...',
  ],
  2: [
    'Consultando protocolos APA e CANMAT para farmacoterapia...',
    'Avaliando interações medicamentosas potenciais...',
    'Selecionando abordagens psicoterapêuticas baseadas em evidências...',
    'Analisando indicações de neuromodulação...',
    'Integrando recomendações de estilo de vida...',
    'Elaborando sugestões de suplementação...',
    'Definindo metas terapêuticas por prazo...',
    'Compilando recomendações de encaminhamento...',
  ],
  3: [
    'Estruturando plano de monitoramento longitudinal...',
    'Definindo métricas de wearable relevantes...',
    'Estabelecendo critérios de reavaliação de urgência...',
    'Compilando referências bibliográficas...',
    'Redigindo declaração de conformidade CFM nº 2.454/2026...',
    'Documentando limitações e observações finais...',
    'Revisando integridade do relatório...',
    'Finalizando seção de monitoramento...',
  ],
}

const ESTIMATED_TOTAL_SECONDS = 120

export { STAGE_LABELS, type StageContent }

export function GeneratingView({
  stages,
  progress,
  error,
}: {
  stages: StageContent[]
  progress: { stage: number; percent: number; message: string } | null
  error: string | null
}) {
  const [elapsed, setElapsed] = useState(0)
  const [reasoningIdx, setReasoningIdx] = useState(0)
  const startRef = useRef(Date.now())
  const logRef = useRef<string[]>([])
  const logEndRef = useRef<HTMLDivElement>(null)

  const currentStage = progress?.stage ?? 1

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const msgs = REASONING_MESSAGES[currentStage] ?? []
    if (msgs.length === 0) return
    const interval = setInterval(() => {
      setReasoningIdx((prev) => {
        const next = (prev + 1) % msgs.length
        const msg = msgs[next]
        logRef.current = [...logRef.current.slice(-12), msg]
        return next
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [currentStage])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [reasoningIdx])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const r = sec % 60
    return `${m}:${r.toString().padStart(2, '0')}`
  }

  const completedStages = stages.length
  const overallPct = Math.min(
    99,
    Math.round(((completedStages * 100 + (progress?.percent ?? 0)) / 300) * 100)
  )
  const remaining = Math.max(0, ESTIMATED_TOTAL_SECONDS - elapsed)

  const msgs = REASONING_MESSAGES[currentStage] ?? []
  const currentMsg = msgs[reasoningIdx % msgs.length] ?? ''

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-lime-400" />
            <span className="text-sm font-medium text-zinc-200">
              Gerando relatório com IA
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{formatTime(elapsed)} decorrido</span>
            <span className="text-zinc-600">|</span>
            <span>~{formatTime(remaining)} restante</span>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Progresso geral</span>
            <span className="text-lime-400 font-medium">{overallPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          {STAGE_LABELS.map((label, i) => {
            const stageNum = i + 1
            const isDone = stages.some((st) => st.stage === stageNum)
            const isCurrent = !isDone && progress?.stage === stageNum
            const pct = isCurrent ? progress.percent : isDone ? 100 : 0
            return (
              <div key={stageNum} className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? 'bg-lime-400 text-zinc-900'
                      : isCurrent
                        ? 'border border-lime-400/50 text-lime-400'
                        : 'border border-zinc-700 text-zinc-600'
                  }`}
                >
                  {isDone ? '✓' : stageNum}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs ${
                        isDone
                          ? 'text-lime-400'
                          : isCurrent
                            ? 'text-zinc-200'
                            : 'text-zinc-600'
                      }`}
                    >
                      {label}
                    </span>
                    {(isDone || isCurrent) && (
                      <span className="text-xs text-zinc-500">{pct}%</span>
                    )}
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-700/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-lime-400' : 'bg-lime-400/70'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/60 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono">{'>'}</span>
          <span>Análise em tempo real</span>
        </div>
        <div className="h-28 overflow-y-auto font-mono text-xs leading-relaxed scrollbar-thin">
          {logRef.current.slice(0, -1).map((msg, i) => (
            <div key={`${msg}-${i}`} className="py-0.5 text-zinc-600">
              <span className="text-zinc-700 mr-2">
                {formatTime(
                  Math.max(0, elapsed - (logRef.current.length - 1 - i) * 3)
                )}
              </span>
              {msg}
            </div>
          ))}
          {currentMsg && (
            <div className="py-0.5 text-lime-400">
              <span className="text-zinc-700 mr-2">{formatTime(elapsed)}</span>
              {currentMsg}
              <span className="animate-pulse">▌</span>
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {error && <InfoBox variant="warning">{error}</InfoBox>}
    </div>
  )
}
