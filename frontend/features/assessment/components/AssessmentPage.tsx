// frontend/features/assessment/components/AssessmentPage.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { generateTestFormData } from '../helpers/generate-test-data'
import {
  clearFormData,
  loadCurrentStep,
  loadFormData,
  saveCurrentStep,
  saveFormData,
} from '../services/localStorage'
import type {
  AssessmentFormData,
  CompanyContext,
  ScaleOption,
  ScaleQuestion,
  StepComponentProps,
} from './assessment.interface'
import { INITIAL_FORM_DATA } from './assessment.interface'
import { ALL_STEPS } from './constants/steps'
import { ProgressBar } from './ProgressBar'
import {
  ClinicalProfileStep,
  FamilyHistoryStep,
  GenericScaleStep,
  HistoryStep,
  LifestyleStep,
  MDQStep,
  MedicationsStep,
  PersonalDataStep,
  PriorReportsStep,
  SCALE_STEP_CONFIGS,
  SummaryStep,
  SupplementsStep,
  SymptomsStep,
  UploadsStep,
  WearablesStep,
  WelcomeStep,
} from './steps'

const IS_DEV = process.env.NEXT_PUBLIC_AVALIACAO_DEV_MODE === 'true'

function AccessGate({
  onUnlock,
}: {
  onUnlock: (ctx?: CompanyContext) => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/assessment/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (data.valid) {
        sessionStorage.setItem('bb_access', '1')
        const ctx: CompanyContext | undefined =
          data.type === 'company'
            ? {
                company_id: data.company_id,
                department: data.department,
                departments: data.departments,
                cycle_id: data.cycle_id,
                code_id: data.code_id,
              }
            : undefined
        onUnlock(ctx)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl backdrop-blur-sm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-light.svg"
          alt="Bright Brains"
          className="mx-auto mb-2 h-9 w-auto"
        />
        <h2 className="text-center text-lg font-semibold text-zinc-100">
          Acesso Restrito
        </h2>
        <p className="text-center text-xs text-zinc-500">
          Digite o código de acesso para continuar
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
          placeholder="Código de acesso"
          autoFocus
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-center text-sm text-white placeholder-zinc-500 transition-colors focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
        />
        {error && (
          <p className="text-center text-xs text-red-400">Código inválido</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 py-3 text-sm font-bold text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export function AssessmentPage() {
  const [authorized, setAuthorized] = useState(false)
  const [data, setData] = useState<AssessmentFormData>(INITIAL_FORM_DATA)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [companyContext, setCompanyContext] = useState<CompanyContext>({})
  const [sessionChecked, setSessionChecked] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const isDevMode = process.env.NEXT_PUBLIC_AVALIACAO_DEV_MODE === 'true'

    let hasSessionFlag = false
    try {
      hasSessionFlag = sessionStorage.getItem('bb_access') === '1'
    } catch {
      // ignore
    }

    if (isDevMode) {
      setAuthorized(true)
      setSessionChecked(true)
    }

    async function checkSession() {
      try {
        const res = await fetch('/api/assessment/check-session')
        const result = await res.json()
        if (cancelled) return

        if (result.authenticated && result.hasInvite) {
          try {
            sessionStorage.setItem('bb_access', '1')
          } catch {
            /* ignore */
          }
          setCompanyContext({
            ...result.companyContext,
            prefilled_email: !!result.userEmail,
          })
          if (result.userEmail) setSessionEmail(result.userEmail)
          setAuthorized(true)
          setSessionChecked(true)
          return
        }
      } catch {
        // Session check failed
      }

      if (!isDevMode) {
        if (hasSessionFlag) {
          setAuthorized(true)
        }
        if (!cancelled) setSessionChecked(true)
      }
    }

    void checkSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!authorized) return
    if (isLoaded) return
    const loaded = loadFormData()
    if (sessionEmail) loaded.email = sessionEmail
    setData(loaded)
    const savedStep = loadCurrentStep()
    setCurrentStepIndex(savedStep >= 0 ? savedStep : 0)
    setIsLoaded(true)
  }, [authorized, sessionEmail, isLoaded])

  useEffect(() => {
    if (!isLoaded || !sessionEmail) return
    setData((prev) =>
      prev.email !== sessionEmail ? { ...prev, email: sessionEmail } : prev
    )
  }, [sessionEmail, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    saveFormData(data)
  }, [data, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    saveCurrentStep(currentStepIndex)
  }, [currentStepIndex, isLoaded])

  const visibleSteps = useMemo(
    () => ALL_STEPS.filter((step) => step.show(data)),
    [data]
  )

  useEffect(() => {
    if (!isLoaded) return
    if (visibleSteps.length === 0) {
      clearFormData()
      setData({ ...INITIAL_FORM_DATA })
      setCurrentStepIndex(0)
      return
    }
    if (currentStepIndex >= visibleSteps.length) {
      setCurrentStepIndex(visibleSteps.length - 1)
      return
    }
    if (currentStepIndex < 0) {
      setCurrentStepIndex(0)
    }
  }, [currentStepIndex, isLoaded, visibleSteps.length])

  const currentStep = visibleSteps[currentStepIndex]

  const goNext = useCallback(() => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStepIndex, visibleSteps.length])

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStepIndex])

  const handleReset = () => {
    if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
      clearFormData()
      setData({ ...INITIAL_FORM_DATA })
      setCurrentStepIndex(0)
    }
  }

  const handleTestFill = useCallback(() => {
    const testData = generateTestFormData()
    setData(testData)
    const stepsForData = ALL_STEPS.filter((s) => s.show(testData))
    const uploadsIdx = stepsForData.findIndex((s) => s.id === 'uploads')
    if (uploadsIdx >= 0) {
      setCurrentStepIndex(uploadsIdx)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!authorized) {
    if (!sessionChecked) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400" />
        </div>
      )
    }
    return (
      <AccessGate
        onUnlock={(ctx) => {
          if (ctx) setCompanyContext(ctx)
          setAuthorized(true)
        }}
      />
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400" />
      </div>
    )
  }

  if (!currentStep) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center shadow-xl backdrop-blur-sm">
          <p className="mb-4 text-sm text-zinc-300">
            Não foi possível carregar a etapa atual.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2 text-sm font-bold text-zinc-900"
          >
            Reiniciar avaliação
          </button>
        </div>
      </div>
    )
  }

  const stepProps: StepComponentProps = {
    data,
    setData,
    onPrev: currentStepIndex > 0 ? goPrev : null,
    onNext: currentStepIndex < visibleSteps.length - 1 ? goNext : null,
    companyContext,
    setCompanyContext,
  }

  const renderStep = () => {
    const id = currentStep.id

    switch (id) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />
      case 'dados':
        return <PersonalDataStep {...stepProps} />
      case 'perfil':
        return <ClinicalProfileStep {...stepProps} />
      case 'historia':
        return <HistoryStep {...stepProps} />
      case 'sintomas':
        return <SymptomsStep {...stepProps} />
      case 'mdq':
        return <MDQStep {...stepProps} />
      case 'medicamentos':
        return <MedicationsStep {...stepProps} />
      case 'suplementos':
        return <SupplementsStep {...stepProps} />
      case 'estilo':
        return <LifestyleStep {...stepProps} />
      case 'familia':
        return <FamilyHistoryStep {...stepProps} />
      case 'uploads':
        return <UploadsStep {...stepProps} />
      case 'laudos':
        return <PriorReportsStep {...stepProps} />
      case 'wearables':
        return <WearablesStep {...stepProps} />
      case 'resumo':
        return <SummaryStep {...stepProps} />
      default: {
        const config = SCALE_STEP_CONFIGS[id]
        if (config) {
          return (
            <GenericScaleStep
              {...stepProps}
              scaleKey={config.scaleKey}
              questions={config.questions as ScaleQuestion[] | string[]}
              options={config.options as ScaleOption[] | null}
              icon={config.icon}
              title={config.title}
              subtitle={config.subtitle}
              badge={config.badge}
              info={config.info}
            />
          )
        }
        return <div className="text-zinc-400">Step not found: {id}</div>
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {currentStep.id !== 'welcome' && (
        <div className="mb-4">
          <ProgressBar steps={visibleSteps} currentIndex={currentStepIndex} />
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm md:p-8">
        {renderStep()}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
        <span>Etapa: {currentStep.label}</span>
        <div className="flex items-center gap-3">
          {IS_DEV && (
            <button
              type="button"
              onClick={handleTestFill}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
            >
              Preencher Teste
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="text-zinc-600 hover:text-red-400"
          >
            Reiniciar formulário
          </button>
        </div>
      </div>
    </div>
  )
}
