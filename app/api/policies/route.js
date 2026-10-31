import { rejectNonLocalRequest } from '@/lib/api'
import { NextResponse } from 'next/server'
import {
  actionOptions,
  deviceComplianceOptions,
  identityStatusOptions,
  networkZoneOptions,
  policyMatrix,
  policyVersion,
  resourceOptions,
  roleOptions,
} from '@/lib/policies'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const rejection = rejectNonLocalRequest(request)
  if (rejection) return rejection
  return NextResponse.json({
    roles: roleOptions,
    actions: actionOptions,
    resources: resourceOptions,
    policies: policyMatrix,
    policyVersion,
    identityStatuses: identityStatusOptions,
    deviceCompliance: deviceComplianceOptions,
    networkZones: networkZoneOptions,
  }, { headers: { 'Cache-Control': 'no-store' } })
}
