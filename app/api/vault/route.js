import { NextResponse } from 'next/server'
import { errorResponse, rateLimitResponse, readJsonBody } from '@/lib/api'
import { evaluateRequest } from '@/lib/guardian'
import { consumeRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const rateLimit = consumeRateLimit(request, { bucket: 'vault-preview', limit: 60 })
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit)
  const headers = getRateLimitHeaders(rateLimit)

  try {
    const payload = await readJsonBody(request)
    const evaluation = evaluateRequest({ ...payload, resource: 'user-private-vault', action: 'Read' })

    return NextResponse.json(
      {
        ok: true,
        vault: evaluation.vaultView,
        decision: evaluation.decision,
        explanation: evaluation.explanation,
        trustScore: evaluation.trustScore,
        policyTrace: evaluation.policyTrace,
      },
      { headers },
    )
  } catch (error) {
    return errorResponse(error, { headers })
  }
}
