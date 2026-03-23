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
    <div className="px-8 py-8">
      <CompanySettingsComponent companyId={company.id} mode="portal" />
    </div>
  )
}
