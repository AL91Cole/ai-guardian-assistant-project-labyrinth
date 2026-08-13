import { describe, expect, it } from 'vitest'
import { logsToCsv } from '../lib/export.js'

describe('audit CSV export', () => {
  it('quotes fields and neutralizes spreadsheet formulas', () => {
    const csv = logsToCsv([
      {
        id: 1,
        timestamp: '2026-08-13T12:00:00.000Z',
        requesterName: '=HYPERLINK("https://example.test")',
        requesterRole: 'Employee',
        resourceLabel: 'Shared Files',
        resourceClassification: 'Internal',
        action: 'Read',
        decision: 'Deny',
        trustScore: 50,
        severity: '',
        scenarioId: '',
        policyVersion: 'test-v1',
        eventHash: 'abc',
        previousHash: 'GENESIS',
        explanation: 'A "quoted" explanation',
      },
    ])

    expect(csv).toContain('"\'=HYPERLINK(""https://example.test"")"')
    expect(csv).toContain('"A ""quoted"" explanation"')
  })
})
