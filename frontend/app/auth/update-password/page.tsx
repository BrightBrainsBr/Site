import { Suspense } from 'react'

import UpdatePasswordPage from '@/auth/update-password/page'

export default function Page() {
  return (
    <Suspense>
      <UpdatePasswordPage />
    </Suspense>
  )
}
