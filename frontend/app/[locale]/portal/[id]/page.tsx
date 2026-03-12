// frontend/app/[locale]/portal/[id]/page.tsx

import { EvaluationDetailPageComponent } from '~/features/portal/components/EvaluationDetailPageComponent'

export default async function PortalDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = await params
  return <EvaluationDetailPageComponent evaluationId={id} />
}
