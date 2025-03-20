import type { IFooterOptions } from '@futurebrand/types/global-options'
import React from 'react'

interface Props extends IFooterOptions {
  locale: string
}

const Footer: React.FC<Props> = async ({ legalText, socialLink, locale }) => {
  return (
    <footer className="print:hidden relative py-10 dark bg-blue-600">
      <div className="container-small flex items-center justify-center">
        <p>Footer</p>
      </div>
    </footer>
  )
}

export default Footer
