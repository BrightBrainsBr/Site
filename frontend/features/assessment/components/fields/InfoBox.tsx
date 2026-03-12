// frontend/features/assessment/components/fields/InfoBox.tsx
'use client'

interface InfoBoxProps {
  children: React.ReactNode
  variant?: 'info' | 'warning' | 'success'
}

const variantStyles = {
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  success: 'border-lime-500/30 bg-lime-500/10 text-lime-300',
}

export function InfoBox({ children, variant = 'info' }: InfoBoxProps) {
  return (
    <div className={`rounded-lg border p-4 text-sm ${variantStyles[variant]}`}>
      {children}
    </div>
  )
}
