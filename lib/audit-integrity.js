import { createHash } from 'node:crypto'

export const AUDIT_GENESIS_HASH = 'GENESIS'

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value ?? null
}

export function getHashPayload(event) {
  return canonicalize({
    id: event.id ?? null,
    timestamp: event.timestamp,
    requesterName: event.requesterName,
    requesterRole: event.requesterRole,
    resource: event.resource,
    resourceClassification: event.resourceClassification,
    action: event.action,
    identityStatus: event.identityStatus,
    deviceCompliance: event.deviceCompliance,
    networkZone: event.networkZone,
    mfaPassed: event.mfaPassed,
    trustedDevice: event.trustedDevice,
    unusualLocation: event.unusualLocation,
    anomalyScore: event.anomalyScore,
    sessionAgeMinutes: event.sessionAgeMinutes,
    failedAttempts: event.failedAttempts,
    ownerKeyPresent: event.ownerKeyPresent,
    trustScore: event.trustScore,
    decision: event.decision,
    explanation: event.explanation,
    labyrinth: event.labyrinth,
    severity: event.severity,
    indicators: event.indicators,
    fakeAssetsVisited: event.fakeAssetsVisited,
    timeline: event.timeline,
    containment: event.containment,
    policyVersion: event.policyVersion,
    scenarioId: event.scenarioId,
    riskFactors: event.riskFactors,
    policyTrace: event.policyTrace,
    attackTechniques: event.attackTechniques,
    defensiveTechniques: event.defensiveTechniques,
    analystBrief: event.analystBrief,
  })
}

export function createAuditHash(event, previousHash = AUDIT_GENESIS_HASH) {
  const payload = JSON.stringify({ previousHash, event: getHashPayload(event) })
  return createHash('sha256').update(payload).digest('hex')
}

export function verifyAuditChain(events = []) {
  const ordered = [...events].sort((left, right) => left.id - right.id)
  let previousHash = AUDIT_GENESIS_HASH

  for (const event of ordered) {
    const expectedHash = createAuditHash(event, previousHash)
    if (event.previousHash !== previousHash || event.eventHash !== expectedHash) {
      return {
        valid: false,
        checked: ordered.length,
        brokenEventId: event.id,
        expectedPreviousHash: previousHash,
        recordedPreviousHash: event.previousHash,
        expectedEventHash: expectedHash,
        recordedEventHash: event.eventHash,
      }
    }
    previousHash = event.eventHash
  }

  return {
    valid: true,
    checked: ordered.length,
    brokenEventId: null,
    headHash: previousHash,
  }
}
