import { redirect } from 'next/navigation'

export default async function EmpresaSignupRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/signup`)
}
