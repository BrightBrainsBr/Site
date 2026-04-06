'use client'

import { CompanySettingsComponent } from '../shared/CompanySettingsComponent'

interface B2BSettingsTabProps {
  companyId: string | null
  isPortalMode?: boolean
}

export function B2BSettingsTab({ companyId, isPortalMode }: B2BSettingsTabProps) {
  if (!companyId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[13px] text-[#64748B]">Empresa não identificada.</p>
      </div>
    )
  }

  return <CompanySettingsComponent companyId={companyId} mode={isPortalMode ? 'portal' : 'b2b'} />
}
