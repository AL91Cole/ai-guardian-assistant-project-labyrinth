import { rejectNonLocalRequest } from '@/lib/api'
import { NextResponse } from 'next/server'
import { getLabyrinthEvents } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const rejection = rejectNonLocalRequest(request)
  if (rejection) return rejection
  return NextResponse.json(
    { events: getLabyrinthEvents(20) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
