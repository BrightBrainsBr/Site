// frontend/components/assessment/AssessmentPage.tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  clearFormData,
  loadCurrentStep,
  loadFormData,
  saveCurrentStep,
  saveFormData,
} from '../../services/assessment/localStorage'
import type {
  AssessmentFormData,
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

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
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
      const { valid } = (await res.json()) as { valid: boolean }

      if (valid) {
        sessionStorage.setItem('bb_access', '1')
        onUnlock()
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

  useEffect(() => {
    try {
      if (sessionStorage.getItem('bb_access') === '1') {
        setAuthorized(true)
      }
    } catch {
      // ignore sessionStorage access issues
    }
  }, [])

  useEffect(() => {
    if (!authorized) return
    setData(loadFormData())
    const savedStep = loadCurrentStep()
    setCurrentStepIndex(savedStep >= 0 ? savedStep : 0)
    setIsLoaded(true)
  }, [authorized])

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

  if (!authorized) {
    return <AccessGate onUnlock={() => setAuthorized(true)} />
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
        <button
          type="button"
          onClick={handleReset}
          className="text-zinc-600 hover:text-red-400"
        >
          Reiniciar formulário
        </button>
      </div>
    </div>
  )
}
