import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { OnboardingSteps, type OnboardingData } from './OnboardingSteps'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: OnboardingData) => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    goal: '',
    level: '',
    disciplines: [],
    firstCompetition: null,
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    onComplete(data)
    onClose()
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true')
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-slate-900/90 backdrop-blur-sm animate-fade-in"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div
        className={clsx(
          'relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden',
          'bg-white dark:bg-slate-800',
          'animate-scale-in'
        )}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <OnboardingSteps
          currentStep={currentStep}
          data={data}
          onDataChange={setData}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
        />
      </div>
    </div>,
    document.body
  )
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed) {
      const timer = setTimeout(() => setShowOnboarding(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const openOnboarding = () => setShowOnboarding(true)
  const closeOnboarding = () => setShowOnboarding(false)

  return {
    showOnboarding,
    openOnboarding,
    closeOnboarding,
  }
}
