import { NextResponse } from 'next/server'
import { getLabyrinthEvents } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ events: getLabyrinthEvents(10) })
}
