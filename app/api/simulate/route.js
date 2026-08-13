import { NextResponse } from 'next/server'
import { errorResponse, rateLimitResponse, readJsonBody } from '@/lib/api'
import {
  getAuditIntegrity,
  getDecisionSummary,
  getLabyrinthEvents,
  getRecentAlerts,
  getRecentLogs,
  recordDecision,
} from '@/lib/db'
import { evaluateRequest } from '@/lib/guardian'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const rateLimit = consumeRateLimit(request, { bucket: 'simulate', limit: 40 })
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit)
  const headers = getRateLimitHeaders(rateLimit)

  try {
    const payload = await readJsonBody(request)
    const evaluation = evaluateRequest(payload)
    const log = recordDecision(evaluation)

    return NextResponse.json(
      {
        ok: true,
        result: evaluation,
        log,
        logs: getRecentLogs(20),
        labyrinthEvents: getLabyrinthEvents(10),
        alerts: getRecentAlerts(20),
        summary: getDecisionSummary(),
        integrity: getAuditIntegrity(),
      },
      { headers },
    )
  } catch (error) {
    return errorResponse(error, { headers })
  }
}
