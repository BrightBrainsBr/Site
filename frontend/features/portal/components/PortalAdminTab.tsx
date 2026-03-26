'use client'

import { CompanySettingsComponent } from '~/features/b2b-dashboard/components/shared/CompanySettingsComponent'

interface Company {
  id: string
  name: string
  cnpj: string | null
  contact_email: string | null
  active: boolean
  allowed_domains: string[] | null
}

interface PortalAdminTabProps {
  company: Company
  onCompanyUpdate: (updates: Partial<Company>) => void
}

export function PortalAdminTab({ company }: PortalAdminTabProps) {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <CompanySettingsComponent companyId={company.id} mode="portal" />
    </div>
  )
}
