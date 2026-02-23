'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'

const steps = [
  { label: 'Analysing prompt…', delay: 0 },
  { label: 'Building structure…', delay: 3000 },
  { label: 'Rendering diagram…', delay: 8000 },
]

export function GenerationLoader() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timers = steps.slice(1).map((step, i) =>
      setTimeout(() => setActiveStep(i + 1), step.delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-brand)]" />
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-3 transition-opacity duration-300"
              style={{ opacity: i <= activeStep ? 1 : 0.3 }}
            >
              {i < activeStep ? (
                <Check
                  className="h-4 w-4 text-[var(--color-success)]"
                  strokeWidth={1.5}
                />
              ) : i === activeStep ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-[var(--color-accent-brand)]"
                  strokeWidth={1.5}
                />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span
                className="text-sm"
                style={{
                  color:
                    i <= activeStep
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-disabled)',
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
