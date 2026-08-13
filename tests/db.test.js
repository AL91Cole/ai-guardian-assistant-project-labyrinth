import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { evaluateRequest } from '../lib/guardian.js'
import { scenarios } from '../lib/scenarios.js'

describe('SQLite audit and alert workflow', () => {
  it('seeds, records, links, and triages simulated security events', async () => {
    const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'labyrinth-db-test-'))
    process.env.LABYRINTH_DATA_DIR = dataDirectory
    const database = await import('../lib/db.js')

    expect(database.getDecisionSummary()).toMatchObject({
      totalRequests: 3,
      allowCount: 1,
      denyCount: 1,
      labyrinthCount: 1,
      openAlerts: 1,
    })
    expect(database.getAuditIntegrity()).toMatchObject({ valid: true, checked: 3 })

    const scenario = scenarios.find((item) => item.id === 'privilege-escalation')
    const evaluation = evaluateRequest({ ...scenario.input, scenarioId: scenario.id })
    const recorded = database.recordDecision(evaluation, {
      timestamp: '2026-08-13T16:00:00.000Z',
    })

    expect(recorded.decision).toBe('Route to Labyrinth')
    expect(database.getAuditIntegrity()).toMatchObject({ valid: true, checked: 4 })

    const alert = database.getRecentAlerts(1)[0]
    const updated = database.updateAlert(alert.id, {
      status: 'Investigating',
      assignee: 'Demo Analyst',
      disposition: 'True Positive',
      notes: 'Validated through the scenario replay.',
    })

    expect(updated).toMatchObject({
      status: 'Investigating',
      assignee: 'Demo Analyst',
      disposition: 'True Positive',
    })
  })
})
