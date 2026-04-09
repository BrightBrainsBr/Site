import { redirect } from 'next/navigation'

export default async function OldResetPasswordRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect(`/${locale}/monitor/reset-password`)
}
