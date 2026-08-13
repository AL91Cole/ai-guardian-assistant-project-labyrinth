import {
  actionRequirement,
  describePermission,
  getPermissionLevel,
  getResourceClassification,
  getResourceLabel,
  isSensitiveResource,
  permissionWeight,
  policyVersion,
} from './policies.js'
import { attackTechniques, defensiveTechniques, getScenarioById } from './scenarios.js'
import { validateAccessRequest } from './validation.js'
import { getVaultSimulation, isKnownVaultOwner } from './vault.js'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function riskFactor(id, label, impact, detail, severity = 'Medium') {
  return { id, label, impact, detail, severity }
}

export function calculateTrust(input) {
  const factors = []

  if (!input.mfaPassed) {
    factors.push(riskFactor('mfa', 'MFA not satisfied', -35, 'The session did not complete the required MFA challenge.', 'High'))
  }
  if (!input.trustedDevice) {
    factors.push(riskFactor('trusted-device', 'Untrusted device', -20, 'The device is not registered as trusted.', 'High'))
  }
  if (input.unusualLocation) {
    factors.push(riskFactor('location', 'Unusual location', -20, 'The request location differs from normal behavior.', 'High'))
  }
  if (input.anomalyScore > 0) {
    const impact = -Math.round(input.anomalyScore * 0.4)
    factors.push(
      riskFactor(
        'anomaly',
        `Anomaly score ${input.anomalyScore}`,
        impact,
        'Behavioral analytics reduced trust in proportion to the anomaly score.',
        input.anomalyScore >= 75 ? 'Critical' : input.anomalyScore >= 50 ? 'High' : 'Low',
      ),
    )
  }
  if (input.identityStatus === 'Suspended') {
    factors.push(riskFactor('identity-status', 'Identity suspended', -35, 'The identity lifecycle system marks this account as suspended.', 'High'))
  } else if (input.identityStatus === 'Terminated') {
    factors.push(riskFactor('identity-status', 'Identity terminated', -80, 'The identity lifecycle system marks this account as terminated.', 'Critical'))
  }
  if (input.deviceCompliance === 'At Risk') {
    factors.push(riskFactor('device-compliance', 'Device at risk', -15, 'Endpoint posture reports unresolved security findings.', 'Medium'))
  } else if (input.deviceCompliance === 'Compromised') {
    factors.push(riskFactor('device-compliance', 'Device compromised', -40, 'Endpoint posture reports active compromise indicators.', 'Critical'))
  }
  if (input.networkZone === 'VPN') {
    factors.push(riskFactor('network-zone', 'VPN network', -3, 'The request arrived through the managed remote-access zone.', 'Low'))
  } else if (input.networkZone === 'Public') {
    factors.push(riskFactor('network-zone', 'Public network', -10, 'The request arrived from an untrusted public network.', 'Medium'))
  }
  if (input.sessionAgeMinutes > 480) {
    factors.push(riskFactor('session-age', 'Stale session', -20, 'The session is older than eight hours and should be re-authenticated.', 'High'))
  } else if (input.sessionAgeMinutes > 120) {
    factors.push(riskFactor('session-age', 'Aging session', -7, 'The session is older than two hours.', 'Low'))
  }
  if (input.failedAttempts > 0) {
    const impact = -Math.min(25, input.failedAttempts * 4)
    factors.push(
      riskFactor(
        'failed-attempts',
        `${input.failedAttempts} recent failed attempt${input.failedAttempts === 1 ? '' : 's'}`,
        impact,
        'Recent failures can indicate guessing, replay, or automation.',
        input.failedAttempts >= 5 ? 'Critical' : input.failedAttempts >= 3 ? 'High' : 'Low',
      ),
    )
  }

  return {
    score: clamp(100 + factors.reduce((total, factor) => total + factor.impact, 0), 0, 100),
    factors,
  }
}

export function calculateTrustScore(input) {
  return calculateTrust(input).score
}

function trace(id, label, outcome, detail) {
  return { id, label, outcome, detail }
}

function hasHighRisk(input, trustScore) {
  return (
    trustScore < 35 ||
    input.anomalyScore >= 75 ||
    input.failedAttempts >= 5 ||
    input.identityStatus !== 'Active' ||
    input.deviceCompliance === 'Compromised' ||
    (input.unusualLocation && !input.trustedDevice) ||
    (!input.mfaPassed && (isSensitiveResource(input.resource) || input.action !== 'Read'))
  )
}

function deduplicateTechniques(techniques) {
  return [...new Map(techniques.map((technique) => [technique.id, technique])).values()]
}

function inferAttackTechniques(input, scenario) {
  const techniques = [...(scenario?.attackTechniques ?? [])]
  if (input.failedAttempts >= 5) techniques.push(attackTechniques.bruteForce)
  if (input.action === 'Manage Permissions') techniques.push(attackTechniques.accountManipulation)
  if (input.unusualLocation || !input.trustedDevice || input.identityStatus !== 'Active') {
    techniques.push(attackTechniques.validAccounts)
  }
  if (input.resource === 'user-private-vault' && !input.ownerKeyPresent) {
    techniques.push(attackTechniques.accountDiscovery)
  }
  if (!techniques.length) techniques.push(attackTechniques.validAccounts)
  return deduplicateTechniques(techniques)
}

function getDefensiveTechniques(input) {
  const techniques = [defensiveTechniques.decoyEnvironment, defensiveTechniques.decoyFile]
  if (input.resource === 'user-private-vault') {
    techniques.push(defensiveTechniques.decoyCredential, defensiveTechniques.decoySessionToken)
  }
  return techniques
}

function buildIndicators(riskFactors, entitled) {
  const indicators = riskFactors
    .filter((factor) => factor.severity !== 'Low' || factor.impact <= -10)
    .map((factor) => `${factor.label}: ${factor.detail}`)

  if (!entitled) indicators.push('No standing permission for the requested action.')
  return indicators.length ? indicators : ['No high-risk indicators were observed.']
}

export function createLabyrinthEvent(input, trustScore, entitled, riskFactors = [], scenario = null) {
  const assetMap = {
    'shared-files': ['decoy://shared/board-calendar-2026.xlsx', 'decoy://shared/vendor-renewal-draft.pdf', 'decoy://shared/employee-directory-copy.csv'],
    'super-secret-files': ['decoy://super-secret/acquisition-plan-v9.pdf', 'decoy://super-secret/key-custody-register.csv', 'decoy://super-secret/executive-bonus-model.xlsx'],
    'semi-secret-files': ['decoy://semi-secret/team-restructure-draft.docx', 'decoy://semi-secret/manager-approvals.csv', 'decoy://semi-secret/project-staffing-plan.xlsx'],
    'not-so-secret-files': ['decoy://not-so-secret/marketing-brief.pdf', 'decoy://not-so-secret/content-calendar.xlsx', 'decoy://not-so-secret/sample-asset-pack.zip'],
    'user-private-vault': ['decoy://vault/recovery-phrases.txt', 'decoy://vault/private-keys.kdbx', 'decoy://vault/identity-scans.enc'],
  }

  const severity =
    trustScore <= 20 || input.anomalyScore >= 85 || input.deviceCompliance === 'Compromised'
      ? 'Critical'
      : trustScore <= 40 || input.anomalyScore >= 70 || input.identityStatus !== 'Active'
        ? 'High'
        : 'Medium'

  return {
    severity,
    fakeAssetsVisited: assetMap[input.resource] ?? assetMap['shared-files'],
    indicators: buildIndicators(riskFactors, entitled),
    timeline: [
      'Policy Enforcement Point blocked the production route',
      'Session fingerprint copied into the isolated decoy segment',
      `Decoy assets for ${getResourceLabel(input.resource)} exposed`,
      'Honeytoken telemetry armed for analyst review',
    ],
    containment: 'Production data remained isolated while the suspicious session was observed inside The Labyrinth.',
    attackTechniques: inferAttackTechniques(input, scenario),
    defensiveTechniques: getDefensiveTechniques(input),
  }
}

function buildAnalystBrief(decision, input, trustScore, riskFactors, entitled) {
  const strongest = [...riskFactors].sort((a, b) => a.impact - b.impact).slice(0, 3)
  const signalSummary = strongest.length
    ? strongest.map((factor) => factor.label).join(', ')
    : 'no material risk deductions'

  return {
    headline: `${decision} — ${getResourceLabel(input.resource)} / ${input.action}`,
    summary: `The deterministic Policy Engine issued ${decision} at trust ${trustScore}. Standing entitlement was ${
      entitled ? 'sufficient' : 'insufficient'
    }; the strongest context signals were ${signalSummary}.`,
    nextStep:
      decision === 'Route to Labyrinth'
        ? 'Review the generated alert, validate the identity and device, then contain or close the case.'
        : decision === 'Deny'
          ? 'Confirm whether access is legitimately required before changing any standing policy.'
          : 'Continue monitoring the session; authorization applies only to this evaluated request.',
    advisoryOnly: true,
  }
}

function evaluateVaultRequest(input, trust, scenario) {
  const knownOwner = isKnownVaultOwner(input.vaultOwner)
  const isOwner = knownOwner && normalize(input.requesterName) === normalize(input.vaultOwner)
  const roleBlocked = ['Admin', 'Executive'].includes(input.requesterRole)
  const entitled = isOwner && !roleBlocked
  const threshold = 85
  const healthyContext =
    input.identityStatus === 'Active' &&
    input.mfaPassed &&
    input.trustedDevice &&
    !input.unusualLocation &&
    input.deviceCompliance === 'Compliant' &&
    input.ownerKeyPresent &&
    input.anomalyScore < 40 &&
    input.failedAttempts < 2 &&
    trust.score >= threshold

  const policyTrace = [
    trace('known-owner', 'Known vault owner', knownOwner ? 'pass' : 'fail', knownOwner ? 'The requested owner exists in the simulation.' : 'Unknown owners fail closed; no fallback vault is selected.'),
    trace('owner-match', 'Requester matches owner', isOwner ? 'pass' : 'fail', isOwner ? 'Requester and vault owner identities match.' : 'Only the named owner may continue.'),
    trace('admin-separation', 'Administrative separation', roleBlocked ? 'fail' : 'pass', roleBlocked ? 'Admins and Executives have no private-vault bypass.' : 'The requester role is eligible for owner-only access.'),
    trace('owner-key', 'Owner-key signal', input.ownerKeyPresent ? 'pass' : 'fail', input.ownerKeyPresent ? 'The simulated owner-held key is present.' : 'No simulated owner-held key is present.'),
    trace('mfa', 'MFA required', input.mfaPassed ? 'pass' : 'fail', input.mfaPassed ? 'MFA challenge passed.' : 'Private vault access cannot proceed without MFA.'),
    trace('device', 'Healthy trusted device', input.trustedDevice && input.deviceCompliance === 'Compliant' ? 'pass' : 'fail', `${input.deviceCompliance} device; trusted=${input.trustedDevice}.`),
    trace('trust-threshold', `Trust threshold ${threshold}`, trust.score >= threshold ? 'pass' : 'fail', `Calculated trust is ${trust.score}.`),
  ]

  let decision = 'Deny'
  let explanation = 'Denied because the owner-only vault requirements were not all satisfied.'

  if (knownOwner && entitled && healthyContext) {
    decision = 'Allow'
    explanation = 'Allowed because the known owner supplied the simulated owner-key signal and passed every private-vault assurance check.'
  } else if (hasHighRisk(input, trust.score)) {
    decision = 'Route to Labyrinth'
    explanation = 'Routed to The Labyrinth because a private vault was targeted under high-risk identity, device, or behavioral conditions.'
  } else if (!knownOwner) {
    explanation = 'Denied because the requested vault owner does not exist. Project Labyrinth never falls back to another owner’s vault.'
  } else if (roleBlocked) {
    explanation = 'Denied because administrative authority does not grant access to owner-controlled private data.'
  } else if (!isOwner) {
    explanation = 'Denied because the requester identity does not match the named vault owner.'
  } else if (!input.ownerKeyPresent) {
    explanation = 'Denied because the simulated owner-held key is absent.'
  } else if (!input.mfaPassed) {
    explanation = 'Denied because private-vault access requires successful MFA.'
  }

  const labyrinthEvent =
    decision === 'Route to Labyrinth'
      ? createLabyrinthEvent(input, trust.score, entitled, trust.factors, scenario)
      : null

  return {
    decision,
    explanation,
    trustScore: trust.score,
    riskFactors: trust.factors,
    permissionLevel: entitled ? 'owner only' : 'none',
    requiredLevel: 'owner only',
    policyTrace,
    labyrinthEvent,
    vaultView: getVaultSimulation({
      requesterRole: input.requesterRole,
      requesterName: input.requesterName,
      vaultOwner: input.vaultOwner,
      ownerKeyPresent: input.ownerKeyPresent,
      allowed: decision === 'Allow',
    }),
    entitled,
  }
}

function evaluateStandardRequest(input, trust, scenario) {
  const permissionLevel = getPermissionLevel(input.requesterRole, input.resource)
  const requiredLevel = actionRequirement[input.action]
  const entitled = permissionWeight[permissionLevel] >= permissionWeight[requiredLevel]
  const threshold = 70
  const highRisk = hasHighRisk(input, trust.score)
  const healthyContext =
    input.identityStatus === 'Active' &&
    input.mfaPassed &&
    input.deviceCompliance !== 'Compromised' &&
    input.anomalyScore < 60 &&
    input.failedAttempts < 5 &&
    trust.score >= threshold

  const policyTrace = [
    trace('identity-status', 'Active identity required', input.identityStatus === 'Active' ? 'pass' : 'fail', `Identity status is ${input.identityStatus}.`),
    trace('entitlement', 'Standing entitlement', entitled ? 'pass' : 'fail', `${input.requesterRole} has ${describePermission(permissionLevel)}; ${input.action} requires ${describePermission(requiredLevel)}.`),
    trace('mfa', 'MFA required', input.mfaPassed ? 'pass' : 'fail', input.mfaPassed ? 'MFA challenge passed.' : 'Access is never allowed without MFA in this lab.'),
    trace('device-posture', 'Device posture', input.deviceCompliance === 'Compromised' ? 'fail' : input.deviceCompliance === 'At Risk' || !input.trustedDevice ? 'warn' : 'pass', `${input.deviceCompliance} device; trusted=${input.trustedDevice}.`),
    trace('behavior', 'Behavioral risk', input.anomalyScore < 60 && input.failedAttempts < 5 ? 'pass' : highRisk ? 'fail' : 'warn', `Anomaly ${input.anomalyScore}; failed attempts ${input.failedAttempts}.`),
    trace('trust-threshold', `Trust threshold ${threshold}`, trust.score >= threshold ? 'pass' : 'fail', `Calculated trust is ${trust.score}.`),
  ]

  let decision = 'Deny'
  let explanation = 'Denied because the dynamic policy engine could not establish enough confidence to allow the request.'

  if (entitled && healthyContext) {
    decision = 'Allow'
    explanation = `Allowed because ${input.requesterRole}s have ${describePermission(permissionLevel)} on ${getResourceLabel(input.resource)}, MFA passed, and the evaluated context met the trust threshold.`
  } else if (highRisk) {
    decision = 'Route to Labyrinth'
    explanation = entitled
      ? 'Routed to The Labyrinth because standing access existed but the identity, device, or behavior appeared compromised.'
      : 'Routed to The Labyrinth because the request lacked entitlement and also matched high-risk indicators.'
  } else if (!entitled) {
    explanation = `Denied because ${input.requesterRole}s have ${describePermission(permissionLevel)} on ${getResourceLabel(input.resource)}, which is insufficient for ${input.action}.`
  } else if (!input.mfaPassed) {
    explanation = 'Denied because the request did not satisfy the mandatory MFA gate.'
  }

  return {
    decision,
    explanation,
    trustScore: trust.score,
    riskFactors: trust.factors,
    permissionLevel,
    requiredLevel,
    policyTrace,
    labyrinthEvent:
      decision === 'Route to Labyrinth'
        ? createLabyrinthEvent(input, trust.score, entitled, trust.factors, scenario)
        : null,
    vaultView: null,
    entitled,
  }
}

export function normalizeRequest(payload = {}) {
  return validateAccessRequest(payload, { allowDefaults: true })
}

export function evaluateRequest(payload = {}) {
  const input = normalizeRequest(payload)
  const trust = calculateTrust(input)
  const scenario = getScenarioById(input.scenarioId)
  const result =
    input.resource === 'user-private-vault'
      ? evaluateVaultRequest(input, trust, scenario)
      : evaluateStandardRequest(input, trust, scenario)

  const analystBrief = buildAnalystBrief(
    result.decision,
    input,
    result.trustScore,
    result.riskFactors,
    result.entitled,
  )

  return {
    input,
    decisionAuthority: 'Deterministic Policy Engine',
    policyVersion,
    resourceClassification: getResourceClassification(input.resource),
    scenario: scenario
      ? { id: scenario.id, title: scenario.title, expectedDecision: scenario.expectedDecision }
      : null,
    analystBrief,
    ...result,
  }
}
