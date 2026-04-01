import { NextResponse } from 'next/server'
import { evaluateRequest } from '@/lib/guardian'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams

  const evaluation = evaluateRequest({
    requesterRole: searchParams.get('requesterRole') || 'Employee',
    requesterName: searchParams.get('requesterName') || 'Jordan',
    vaultOwner: searchParams.get('vaultOwner') || 'Jordan',
    resource: 'user-private-vault',
    action: 'Read',
    mfaPassed: searchParams.get('mfaPassed') || 'true',
    trustedDevice: searchParams.get('trustedDevice') || 'true',
    unusualLocation: searchParams.get('unusualLocation') || 'false',
    anomalyScore: searchParams.get('anomalyScore') || '0',
  })

  return NextResponse.json({
    vault: evaluation.vaultView,
    decision: evaluation.decision,
    explanation: evaluation.explanation,
    trustScore: evaluation.trustScore,
  })
}
