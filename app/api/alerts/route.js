import { NextResponse } from 'next/server'
import { errorResponse, rateLimitResponse, readJsonBody } from '@/lib/api'
import { getDecisionSummary, getRecentAlerts, updateAlert } from '@/lib/db'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { validateAlertUpdate, validatePositiveInteger } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { alerts: getRecentAlerts(50), summary: getDecisionSummary() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function PATCH(request) {
  const rateLimit = consumeRateLimit(request, { bucket: 'alert-update', limit: 60 })
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit)
  const headers = getRateLimitHeaders(rateLimit)

  try {
    const payload = await readJsonBody(request)
    const id = validatePositiveInteger(payload.id, 'id')
    const changes = validateAlertUpdate(
      Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'id')),
    )
    const alert = updateAlert(id, changes)

    if (!alert) {
      return NextResponse.json(
        { ok: false, error: 'Not found', message: `Alert ${id} does not exist.` },
        { status: 404, headers },
      )
    }

    return NextResponse.json(
      { ok: true, alert, alerts: getRecentAlerts(50), summary: getDecisionSummary() },
      { headers },
    )
  } catch (error) {
    return errorResponse(error, { headers })
  }
}
