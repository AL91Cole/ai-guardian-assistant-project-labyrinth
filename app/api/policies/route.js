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

export async function GET() {
  return NextResponse.json({
    roles: roleOptions,
    actions: actionOptions,
    resources: resourceOptions,
    policies: policyMatrix,
    policyVersion,
    identityStatuses: identityStatusOptions,
    deviceCompliance: deviceComplianceOptions,
    networkZones: networkZoneOptions,
  })
}
