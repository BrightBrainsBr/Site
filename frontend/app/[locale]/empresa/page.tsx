// frontend/app/[locale]/empresa/page.tsx

import { redirect } from 'next/navigation'

export default async function EmpresaRootPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/empresa/login`)
}
