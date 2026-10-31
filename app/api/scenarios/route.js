import { rejectNonLocalRequest } from '@/lib/api'
import { NextResponse } from 'next/server'
import { getScenarioCatalog } from '@/lib/scenarios'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const rejection = rejectNonLocalRequest(request)
  if (rejection) return rejection
  return NextResponse.json(
    { scenarios: getScenarioCatalog() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
