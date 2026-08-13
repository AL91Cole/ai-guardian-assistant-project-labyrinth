import { describe, expect, it } from 'vitest'
import { AUDIT_GENESIS_HASH, createAuditHash, verifyAuditChain } from '../lib/audit-integrity.js'

function makeEvent(id, decision) {
  return {
    id,
    timestamp: `2026-08-13T12:0${id}:00.000Z`,
    requesterName: 'Jordan',
    requesterRole: 'Manager',
    resource: 'semi-secret-files',
    resourceClassification: 'Confidential',
    action: 'Read',
    identityStatus: 'Active',
    deviceCompliance: 'Compliant',
    networkZone: 'Corporate',
    mfaPassed: true,
    trustedDevice: true,
    unusualLocation: false,
    anomalyScore: 5,
    sessionAgeMinutes: 10,
    failedAttempts: 0,
    ownerKeyPresent: false,
    trustScore: 98,
    decision,
    explanation: `${decision} by deterministic policy.`,
    labyrinth: false,
    severity: null,
    indicators: [],
    fakeAssetsVisited: [],
    timeline: [],
    containment: null,
    policyVersion: 'test-v1',
    scenarioId: null,
    riskFactors: [],
    policyTrace: [],
    attackTechniques: [],
    defensiveTechniques: [],
    analystBrief: { advisoryOnly: true },
  }
}

function chain(events) {
  let previousHash = AUDIT_GENESIS_HASH
  return events.map((event) => {
    const eventHash = createAuditHash(event, previousHash)
    const linked = { ...event, previousHash, eventHash }
    previousHash = eventHash
    return linked
  })
}

describe('tamper-evident audit chain', () => {
  it('verifies an intact sequence', () => {
    const events = chain([makeEvent(1, 'Allow'), makeEvent(2, 'Deny')])

    expect(verifyAuditChain(events)).toMatchObject({
      valid: true,
      checked: 2,
      brokenEventId: null,
      headHash: events[1].eventHash,
    })
  })

  it('detects a modified historical event', () => {
    const events = chain([makeEvent(1, 'Allow'), makeEvent(2, 'Deny')])
    events[0] = { ...events[0], decision: 'Allow after edit' }

    expect(verifyAuditChain(events)).toMatchObject({ valid: false, brokenEventId: 1 })
  })

  it('covers defensive evidence fields in the hash payload', () => {
    const events = chain([makeEvent(1, 'Route to Labyrinth')])
    events[0] = { ...events[0], fakeAssetsVisited: ['decoy://changed/path'] }

    expect(verifyAuditChain(events)).toMatchObject({ valid: false, brokenEventId: 1 })
  })
})
