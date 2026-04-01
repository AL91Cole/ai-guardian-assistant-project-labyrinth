import {
  actionRequirement,
  describePermission,
  getPermissionLevel,
  getResourceLabel,
  permissionWeight,
} from '@/lib/policies'
import { getVaultSimulation } from '@/lib/vault'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function toBoolean(value) {
  return value === true || value === 'true'
}

function toNumber(value) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 0
  return clamp(parsed, 0, 100)
}

export function calculateTrustScore(input) {
  let score = 100

  if (!input.mfaPassed) score -= 30
  if (!input.trustedDevice) score -= 20
  if (input.unusualLocation) score -= 20

  score -= Math.round(input.anomalyScore * 0.5)

  return clamp(score, 0, 100)
}

function buildIndicators(input, entitled) {
  const indicators = []

  if (!input.mfaPassed) indicators.push('MFA challenge not passed')
  if (!input.trustedDevice) indicators.push('Request came from an untrusted device')
  if (input.unusualLocation) indicators.push('Geo-context does not match normal behavior')
  if (input.anomalyScore >= 60) indicators.push(`High anomaly score: ${input.anomalyScore}`)
  if (!entitled) indicators.push('No standing permission for requested action')

  return indicators.length ? indicators : ['No high-risk indicators were observed']
}

export function createLabyrinthEvent(input, trustScore, entitled) {
  const assetMap = {
    'shared-files': [
      'decoy://shared/board-calendar-2026.xlsx',
      'decoy://shared/vendor-renewal-draft.pdf',
      'decoy://shared/employee-directory-copy.csv',
    ],
    'super-secret-files': [
      'decoy://super-secret/acquisition-plan-v9.pdf',
      'decoy://super-secret/key-custody-register.csv',
      'decoy://super-secret/executive-bonus-model.xlsx',
    ],
    'semi-secret-files': [
      'decoy://semi-secret/team-restructure-draft.docx',
      'decoy://semi-secret/manager-approvals.csv',
      'decoy://semi-secret/project-staffing-plan.xlsx',
    ],
    'not-so-secret-files': [
      'decoy://not-so-secret/marketing-brief.pdf',
      'decoy://not-so-secret/content-calendar.xlsx',
      'decoy://not-so-secret/sample-asset-pack.zip',
    ],
    'user-private-vault': [
      'decoy://vault/recovery-phrases.txt',
      'decoy://vault/private-keys.kdbx',
      'decoy://vault/identity-scans.enc',
    ],
  }

  const severity =
    trustScore <= 20 || input.anomalyScore >= 85
      ? 'Critical'
      : trustScore <= 35 || input.anomalyScore >= 70
        ? 'High'
        : 'Medium'

  return {
    severity,
    fakeAssetsVisited: assetMap[input.resource] ?? assetMap['shared-files'],
    indicators: buildIndicators(input, entitled),
    timeline: [
      'Session fingerprint mirrored into decoy segment',
      `Decoy assets for ${getResourceLabel(input.resource)} exposed`,
      'Honeytoken beacons armed and monitored',
      'Lateral movement blocked from production resources',
    ],
    containment: 'Production data remained isolated while the session was observed inside The Labyrinth.',
  }
}

function evaluateVaultRequest(input, trustScore) {
  const isOwner = normalize(input.requesterName) === normalize(input.vaultOwner)
  const entitled = isOwner && !['Admin', 'Executive'].includes(input.requesterRole)
  const highRisk =
    trustScore < 35 ||
    input.anomalyScore >= 70 ||
    ((!input.mfaPassed || !input.trustedDevice) && input.unusualLocation)

  let decision = 'Deny'
  let explanation = ''

  if (['Admin', 'Executive'].includes(input.requesterRole)) {
    explanation =
      'Denied because the User Private Vault is sealed to admins and executives by policy. Administrative control does not imply personal data access.'
  } else if (!isOwner) {
    explanation =
      'Denied because only the named vault owner can decrypt this vault. The request identity did not match the vault owner.'
  } else if (trustScore < 55) {
    explanation =
      'Denied because the requester is the owner, but the surrounding context did not meet the zero-trust assurance threshold for a private vault unlock.'
  } else {
    decision = 'Allow'
    explanation =
      'Allowed because the requester is the vault owner, the action is within owner-only Full Control, and the session met the trust threshold.'
  }

  let labyrinthEvent = null
  if (decision === 'Deny' && highRisk) {
    decision = 'Route to Labyrinth'
    explanation =
      'Routed to The Labyrinth because a protected private vault was targeted under suspicious conditions. The session was diverted into a decoy vault environment.'
    labyrinthEvent = createLabyrinthEvent(input, trustScore, entitled)
  }

  return {
    decision,
    explanation,
    trustScore,
    permissionLevel: entitled ? 'full' : 'none',
    requiredLevel: 'full',
    labyrinthEvent,
    vaultView: getVaultSimulation({
      requesterRole: input.requesterRole,
      requesterName: input.requesterName,
      vaultOwner: input.vaultOwner,
      allowed: decision === 'Allow',
    }),
  }
}

function evaluateStandardRequest(input, trustScore) {
  const permissionLevel = getPermissionLevel(input.requesterRole, input.resource)
  const requiredLevel = actionRequirement[input.action] ?? 'read'
  const entitled = permissionWeight[permissionLevel] >= permissionWeight[requiredLevel]
  const highRisk =
    trustScore < 35 ||
    input.anomalyScore >= 75 ||
    ((!input.mfaPassed || !input.trustedDevice) && input.unusualLocation)
  const suspicious =
    input.anomalyScore >= 55 ||
    input.unusualLocation ||
    !input.mfaPassed ||
    !input.trustedDevice

  let decision = 'Deny'
  let explanation = ''

  if (entitled && trustScore >= 70 && input.anomalyScore < 60) {
    decision = 'Allow'
    explanation = `Allowed because ${input.requesterRole}s have ${describePermission(permissionLevel)} on ${getResourceLabel(
      input.resource,
    )}, and the session context remained within the trust threshold.`
  } else if (!entitled && highRisk) {
    decision = 'Route to Labyrinth'
    explanation =
      'Routed to The Labyrinth because the request lacked standing permission and also matched suspicious zero-trust indicators.'
  } else if (entitled && highRisk) {
    decision = 'Route to Labyrinth'
    explanation =
      'Routed to The Labyrinth because the role had standing access, but the session context looked compromised. Production data stayed isolated.'
  } else if (!entitled) {
    explanation = `Denied because ${input.requesterRole}s only have ${describePermission(permissionLevel)} on ${getResourceLabel(
      input.resource,
    )}, which is not enough for ${input.action}.`
  } else if (suspicious) {
    explanation =
      'Denied because the requester had standing permission, but the session context was not strong enough to pass dynamic zero-trust evaluation.'
  } else {
    explanation = 'Denied because the dynamic policy engine could not establish enough confidence to allow the request.'
  }

  return {
    decision,
    explanation,
    trustScore,
    permissionLevel,
    requiredLevel,
    labyrinthEvent: decision === 'Route to Labyrinth' ? createLabyrinthEvent(input, trustScore, entitled) : null,
    vaultView: null,
  }
}

export function normalizeRequest(payload = {}) {
  return {
    requesterRole: payload.requesterRole || 'Employee',
    requesterName: payload.requesterName || 'Jordan',
    vaultOwner: payload.vaultOwner || payload.requesterName || 'Jordan',
    resource: payload.resource || 'shared-files',
    action: payload.action || 'Read',
    mfaPassed: toBoolean(payload.mfaPassed),
    trustedDevice: toBoolean(payload.trustedDevice),
    unusualLocation: toBoolean(payload.unusualLocation),
    anomalyScore: toNumber(payload.anomalyScore),
  }
}

export function evaluateRequest(payload = {}) {
  const input = normalizeRequest(payload)
  const trustScore = calculateTrustScore(input)

  const result =
    input.resource === 'user-private-vault'
      ? evaluateVaultRequest(input, trustScore)
      : evaluateStandardRequest(input, trustScore)

  return {
    input,
    ...result,
  }
}
