import { PreviewLayout } from '@futurebrand/contexts'
import { unstable_noStore } from 'next/cache'
import React from 'react'

export const fetchCache = 'force-no-store'
export const revalidate = 0

const Layout: React.FC<React.PropsWithChildren> = async ({ children }) => {
  unstable_noStore()
  return <PreviewLayout>{children}</PreviewLayout>
}

export default Layout
