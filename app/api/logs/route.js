import { NextResponse } from 'next/server'
import { getRecentLogs } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ logs: getRecentLogs(20) })
}
