export const attackTechniques = {
  validAccounts: { id: 'T1078', name: 'Valid Accounts', url: 'https://attack.mitre.org/techniques/T1078/' },
  bruteForce: { id: 'T1110', name: 'Brute Force', url: 'https://attack.mitre.org/techniques/T1110/' },
  accountManipulation: { id: 'T1098', name: 'Account Manipulation', url: 'https://attack.mitre.org/techniques/T1098/' },
  accountDiscovery: { id: 'T1087', name: 'Account Discovery', url: 'https://attack.mitre.org/techniques/T1087/' },
}

export const defensiveTechniques = {
  decoyEnvironment: { id: 'D3-DE', name: 'Decoy Environment', url: 'https://d3fend.mitre.org/technique/d3f:DecoyEnvironment/' },
  decoyFile: { id: 'D3-DF', name: 'Decoy File', url: 'https://d3fend.mitre.org/technique/d3f:DecoyFile/' },
  decoyCredential: { id: 'D3-DUC', name: 'Decoy User Credential', url: 'https://d3fend.mitre.org/technique/d3f:DecoyUserCredential/' },
  decoySessionToken: { id: 'D3-DST', name: 'Decoy Session Token', url: 'https://d3fend.mitre.org/technique/d3f:DecoySessionToken/' },
}

export const scenarios = [
  {
    id: 'baseline-manager-write', title: 'Baseline manager workflow', category: 'Normal Activity',
    summary: 'A manager writes to an authorized confidential team folder from a healthy session.',
    objective: 'Confirm that healthy, entitled activity is allowed and fully audited.', expectedDecision: 'Allow', attackTechniques: [],
    input: { requesterRole: 'Manager', requesterName: 'Jordan', vaultOwner: 'Jordan', resource: 'semi-secret-files', action: 'Write', mfaPassed: true, trustedDevice: true, unusualLocation: false, anomalyScore: 12, identityStatus: 'Active', deviceCompliance: 'Compliant', networkZone: 'Corporate', sessionAgeMinutes: 24, failedAttempts: 0, ownerKeyPresent: false },
  },
  {
    id: 'healthy-unauthorized-read', title: 'Low-risk unauthorized read', category: 'Least Privilege',
    summary: 'An employee requests a restricted executive file from an otherwise healthy session.',
    objective: 'Demonstrate a clean denial without activating deception.', expectedDecision: 'Deny', attackTechniques: [],
    input: { requesterRole: 'Employee', requesterName: 'Casey', vaultOwner: 'Casey', resource: 'super-secret-files', action: 'Read', mfaPassed: true, trustedDevice: true, unusualLocation: false, anomalyScore: 8, identityStatus: 'Active', deviceCompliance: 'Compliant', networkZone: 'Corporate', sessionAgeMinutes: 18, failedAttempts: 0, ownerKeyPresent: false },
  },
  {
    id: 'impossible-travel-takeover', title: 'Impossible-travel account takeover', category: 'Compromised Identity',
    summary: 'A valid executive identity appears from an unusual public location on a compromised device.',
    objective: 'Detect a valid-account abuse pattern and divert the session into monitored decoys.', expectedDecision: 'Route to Labyrinth', attackTechniques: [attackTechniques.validAccounts],
    input: { requesterRole: 'Executive', requesterName: 'Avery', vaultOwner: 'Alex', resource: 'super-secret-files', action: 'Read', mfaPassed: true, trustedDevice: false, unusualLocation: true, anomalyScore: 82, identityStatus: 'Active', deviceCompliance: 'Compromised', networkZone: 'Public', sessionAgeMinutes: 7, failedAttempts: 2, ownerKeyPresent: false },
  },
  {
    id: 'privilege-escalation', title: 'Privilege-escalation attempt', category: 'Authorization Abuse',
    summary: 'An employee attempts to change permissions on a restricted resource after repeated failures.',
    objective: 'Correlate entitlement failure with account-manipulation behavior.', expectedDecision: 'Route to Labyrinth', attackTechniques: [attackTechniques.accountManipulation],
    input: { requesterRole: 'Employee', requesterName: 'Casey', vaultOwner: 'Casey', resource: 'super-secret-files', action: 'Manage Permissions', mfaPassed: false, trustedDevice: false, unusualLocation: false, anomalyScore: 72, identityStatus: 'Active', deviceCompliance: 'At Risk', networkZone: 'VPN', sessionAgeMinutes: 96, failedAttempts: 4, ownerKeyPresent: false },
  },
  {
    id: 'credential-replay', title: 'Credential replay against a private vault', category: 'Credential Attack',
    summary: 'An unknown session repeatedly targets a private vault without MFA or an owner key.',
    objective: 'Exercise brute-force detection and decoy credential controls.', expectedDecision: 'Route to Labyrinth', attackTechniques: [attackTechniques.bruteForce, attackTechniques.validAccounts],
    input: { requesterRole: 'Employee', requesterName: 'Unknown Session', vaultOwner: 'Jordan', resource: 'user-private-vault', action: 'Read', mfaPassed: false, trustedDevice: false, unusualLocation: true, anomalyScore: 95, identityStatus: 'Active', deviceCompliance: 'Compromised', networkZone: 'Public', sessionAgeMinutes: 3, failedAttempts: 12, ownerKeyPresent: false },
  },
  {
    id: 'suspended-insider', title: 'Suspended insider deletion attempt', category: 'Insider Risk',
    summary: 'A suspended manager attempts to delete confidential team data from an aging session.',
    objective: 'Show identity-lifecycle status overriding previously valid standing permissions.', expectedDecision: 'Route to Labyrinth', attackTechniques: [attackTechniques.validAccounts],
    input: { requesterRole: 'Manager', requesterName: 'Jordan', vaultOwner: 'Jordan', resource: 'semi-secret-files', action: 'Delete', mfaPassed: true, trustedDevice: true, unusualLocation: false, anomalyScore: 64, identityStatus: 'Suspended', deviceCompliance: 'At Risk', networkZone: 'VPN', sessionAgeMinutes: 540, failedAttempts: 1, ownerKeyPresent: false },
  },
  {
    id: 'vault-owner-valid', title: 'Healthy private-vault unlock', category: 'Privacy Control',
    summary: 'The named owner supplies the simulated owner key from a healthy, MFA-verified device.',
    objective: 'Confirm that owner-only access succeeds without an administrative bypass.', expectedDecision: 'Allow', attackTechniques: [],
    input: { requesterRole: 'Employee', requesterName: 'Jordan', vaultOwner: 'Jordan', resource: 'user-private-vault', action: 'Read', mfaPassed: true, trustedDevice: true, unusualLocation: false, anomalyScore: 4, identityStatus: 'Active', deviceCompliance: 'Compliant', networkZone: 'Corporate', sessionAgeMinutes: 9, failedAttempts: 0, ownerKeyPresent: true },
  },
  {
    id: 'admin-vault-bypass', title: 'Administrative vault-bypass attempt', category: 'Privacy Control',
    summary: 'An administrator targets an owner-only vault from an untrusted, anomalous session.',
    objective: 'Prove that technical administration never grants private-data access.', expectedDecision: 'Route to Labyrinth', attackTechniques: [attackTechniques.accountDiscovery, attackTechniques.validAccounts],
    input: { requesterRole: 'Admin', requesterName: 'Platform Admin', vaultOwner: 'Alex', resource: 'user-private-vault', action: 'Read', mfaPassed: false, trustedDevice: false, unusualLocation: true, anomalyScore: 88, identityStatus: 'Active', deviceCompliance: 'Compromised', networkZone: 'Public', sessionAgeMinutes: 2, failedAttempts: 6, ownerKeyPresent: false },
  },
]

const scenarioLookup = Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario]))

export function getScenarioById(scenarioId) {
  return scenarioId ? scenarioLookup[scenarioId] ?? null : null
}

export function getScenarioCatalog() {
  return scenarios.map(({ input, ...scenario }) => ({ ...scenario, input: { ...input, scenarioId: scenario.id } }))
}
