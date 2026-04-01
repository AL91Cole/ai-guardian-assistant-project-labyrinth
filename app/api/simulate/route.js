import { NextResponse } from 'next/server'
import { getDecisionSummary, getLabyrinthEvents, getRecentLogs, recordDecision } from '@/lib/db'
import { evaluateRequest } from '@/lib/guardian'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const payload = await request.json()
  const evaluation = evaluateRequest(payload)
  const log = recordDecision(evaluation)

  return NextResponse.json({
    ok: true,
    result: evaluation,
    log,
    logs: getRecentLogs(12),
    labyrinthEvents: getLabyrinthEvents(6),
    summary: getDecisionSummary(),
  })
}
