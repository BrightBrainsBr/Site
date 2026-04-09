import { redirect } from 'next/navigation'

export default async function OldDashboardRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/monitor`)
}
