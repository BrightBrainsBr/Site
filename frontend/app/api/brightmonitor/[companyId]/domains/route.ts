// frontend/app/api/brightmonitor/[companyId]/domains/route.ts

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(
    { error: 'Deprecated — use /gro instead' },
    { status: 410 }
  )
}
