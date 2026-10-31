import { rejectNonLocalRequest } from '@/lib/api'
import { NextResponse } from 'next/server'
import { getAuditIntegrity, getDecisionSummary, getRecentLogs } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const rejection = rejectNonLocalRequest(request)
  if (rejection) return rejection
  return NextResponse.json(
    { logs: getRecentLogs(50), summary: getDecisionSummary(), integrity: getAuditIntegrity() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
