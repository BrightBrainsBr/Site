import { redirect } from 'next/navigation'

async function Page({ params }: any) {
  const { locale } = await params

  redirect(`/${locale}`)
}

export default Page
