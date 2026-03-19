// frontend/shared/components/ui/BBButtonComponent.tsx

'use client'

import * as React from 'react'

import { cn } from '~/shared/utils/cn'

type BBButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface BBButtonComponentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BBButtonVariant
  loading?: boolean
  loadingText?: string
}

const variantStyles: Record<BBButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#00c9b1] to-[#0090ff] font-bold text-black hover:opacity-90',
  secondary:
    'bg-[#0D9488] font-semibold text-white hover:bg-[#0D9488]/80',
  ghost:
    'bg-transparent font-medium text-[#cce6f7] hover:bg-[rgba(255,255,255,0.05)]',
  danger:
    'bg-red-600/20 font-semibold text-red-300 hover:bg-red-600/30',
}

export function BBButtonComponent({
  variant = 'primary',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  ...rest
}: BBButtonComponentProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={cn(
        'w-full rounded-lg py-3 text-sm transition-all disabled:opacity-50',
        variantStyles[variant],
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {loadingText ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
