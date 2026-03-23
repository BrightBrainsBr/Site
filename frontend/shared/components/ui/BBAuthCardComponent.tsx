// frontend/shared/components/ui/BBAuthCardComponent.tsx

'use client'

import * as React from 'react'

import { cn } from '~/shared/utils/cn'

interface BBAuthCardComponentProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
}

export function BBAuthCardComponent({
  icon,
  title,
  subtitle,
  children,
  className,
}: BBAuthCardComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className={cn('w-full max-w-sm', className)}>
        <div className="flex flex-col gap-6 rounded-xl border border-[#1a3a5c] bg-[#0c1a2e]/80 p-8 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00c9b1] to-[#0090ff]">
              {icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#cce6f7]">{title}</h2>
              <p className="text-xs text-[#5a7fa0]">{subtitle}</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
