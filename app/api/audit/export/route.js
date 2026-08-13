import { getAllLogs, getAuditIntegrity } from '@/lib/db'
import { logsToCsv } from '@/lib/export'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const format = new URL(request.url).searchParams.get('format')?.toLowerCase() || 'json'
  const logs = getAllLogs(1_000)
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')

  if (format === 'csv') {
    return new Response(logsToCsv(logs), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="project-labyrinth-audit-${timestamp}.csv"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
    })
  }

  if (format !== 'json') {
    return Response.json(
      { ok: false, error: 'Invalid format', message: 'Use format=json or format=csv.' },
      { status: 400 },
    )
  }

  return new Response(
    JSON.stringify({ exportedAt: new Date().toISOString(), integrity: getAuditIntegrity(), logs }, null, 2),
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="project-labyrinth-audit-${timestamp}.json"`,
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  )
}
