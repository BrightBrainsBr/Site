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
  TriageStep,
  UploadsStep,
  WearablesStep,
  WelcomeStep,
} from './steps'

export function AssessmentPage() {
  const [data, setData] = useState<AssessmentFormData>(INITIAL_FORM_DATA)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setData(loadFormData())
    setCurrentStepIndex(loadCurrentStep())
    setIsLoaded(true)
  }, [])

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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400" />
      </div>
    )
  }

  if (!currentStep) return null

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
      case 'triagem':
        return <TriageStep {...stepProps} />
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
      <div className="mb-4">
        <ProgressBar steps={visibleSteps} currentIndex={currentStepIndex} />
      </div>

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
