import { NextResponse } from 'next/server'
import { actionOptions, policyMatrix, resourceOptions, roleOptions } from '@/lib/policies'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    roles: roleOptions,
    actions: actionOptions,
    resources: resourceOptions,
    policies: policyMatrix,
  })
}
