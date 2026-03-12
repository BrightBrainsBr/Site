'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React from 'react'

export function NuqsProvider({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
