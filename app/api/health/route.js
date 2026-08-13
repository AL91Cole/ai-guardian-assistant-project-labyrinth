import { NextResponse } from 'next/server'
import { getAuditIntegrity, getDecisionSummary } from '@/lib/db'
import { policyVersion } from '@/lib/policies'

export const dynamic = 'force-dynamic'

export async function GET() {
  const integrity = getAuditIntegrity()
  return NextResponse.json(
    {
      ok: integrity.valid,
      service: 'project-labyrinth',
      version: '0.2.0',
      policyVersion,
      integrity,
      summary: getDecisionSummary(),
    },
    { status: integrity.valid ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
