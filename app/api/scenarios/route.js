import { NextResponse } from 'next/server'
import { getScenarioCatalog } from '@/lib/scenarios'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    { scenarios: getScenarioCatalog() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
