// frontend/app/[locale]/portal/empresas/[id]/page.tsx

import { PortalEmpresaDetailPageComponent } from '~/features/portal/components/PortalEmpresaDetailPageComponent'

export default function PortalEmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <PortalEmpresaDetailPageComponent params={params} />
}
