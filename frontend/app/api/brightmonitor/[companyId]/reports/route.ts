// frontend/app/api/brightmonitor/[companyId]/reports/route.ts

import { NextResponse } from 'next/server'

const DEPRECATED_BODY = {
  error: 'Deprecated. Use /reports/pgr/[slug] or /reports/analise-ia/[slug]',
}

export async function GET() {
  return NextResponse.json(DEPRECATED_BODY, { status: 410 })
}

export async function POST() {
  return NextResponse.json(DEPRECATED_BODY, { status: 410 })
}
