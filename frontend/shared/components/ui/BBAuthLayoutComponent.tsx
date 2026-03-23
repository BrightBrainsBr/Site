// frontend/shared/components/ui/BBAuthLayoutComponent.tsx

'use client'

import * as React from 'react'

interface BBAuthLayoutComponentProps {
  heading: string
  subheading?: string
  cardTitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function BBAuthLayoutComponent({
  heading,
  subheading,
  cardTitle,
  children,
  footer,
}: BBAuthLayoutComponentProps) {
  return (
    <div className="min-h-screen bg-[#060e1a]">
      <div className="text-center pt-16 pb-6 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[#cce6f7] mb-3 leading-tight max-w-4xl mx-auto">
          {heading}
        </h1>
        {subheading && (
          <p className="text-base text-[#5a7fa0] max-w-lg mx-auto">
            {subheading}
          </p>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border-t-4 border-[#00c9b1] bg-[#0c1a2e]/80 shadow-xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#cce6f7]">{cardTitle}</h3>
          </div>
          {children}
        </div>

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </div>
    </div>
  )
}
