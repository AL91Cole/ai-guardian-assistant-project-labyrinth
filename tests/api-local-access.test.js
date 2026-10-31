import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('../lib/db.js', () => {
  const rejectAccess = () => { throw new Error('Database access must not precede the local request guard.') }
  return {
    getAuditIntegrity: rejectAccess,
    getDecisionSummary: rejectAccess,
    getLabyrinthEvents: rejectAccess,
    getRecentAlerts: rejectAccess,
    getRecentLogs: rejectAccess,
    recordDecision: rejectAccess,
    updateAlert: rejectAccess,
    getAllLogs: rejectAccess,
  }
})

const routes = [
  () => import('../app/api/alerts/route.js'),
  () => import('../app/api/audit/export/route.js'),
  () => import('../app/api/health/route.js'),
  () => import('../app/api/labyrinth/route.js'),
  () => import('../app/api/logs/route.js'),
  () => import('../app/api/policies/route.js'),
  () => import('../app/api/scenarios/route.js'),
  () => import('../app/api/simulate/route.js'),
  () => import('../app/api/vault/route.js'),
]

describe('API local access enforcement', () => {
  it('rejects foreign hosts and origins in every exported handler before database access', async () => {
    let handlersChecked = 0
    for (const load of routes) {
      const routeModule = await load()
      for (const method of ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD']) {
        if (typeof routeModule[method] !== 'function') continue
        handlersChecked += 1
        for (const headers of [{ host: 'attacker.example' },
          { host: '127.0.0.1:3000', origin: 'https://attacker.example' }]) {
          const response = await routeModule[method](new NextRequest('http://127.0.0.1:3000/api/test', { method, headers }))
          expect(response.status).toBe(403)
          expect(response.headers.get('cache-control')).toBe('no-store')
        }
      }
    }
    expect(handlersChecked).toBe(10)
  })
})
