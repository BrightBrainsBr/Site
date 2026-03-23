// frontend/app/api/portal/lib/validatePortalSession.ts

import { cookies } from 'next/headers'

export async function validatePortalSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('portal_session')
  return !!session?.value
}
