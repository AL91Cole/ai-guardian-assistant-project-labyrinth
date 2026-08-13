import { describe, expect, it } from 'vitest'
import { evaluateRequest } from '../lib/guardian.js'
import { scenarios } from '../lib/scenarios.js'
import { ValidationError } from '../lib/validation.js'

describe('Guardian policy engine', () => {
  it.each(scenarios)('replays $id as $expectedDecision', (scenario) => {
    const result = evaluateRequest({ ...scenario.input, scenarioId: scenario.id })

    expect(result.decision).toBe(scenario.expectedDecision)
    expect(result.policyTrace.length).toBeGreaterThan(0)
    expect(result.decisionAuthority).toBe('Deterministic Policy Engine')
    expect(result.analystBrief.advisoryOnly).toBe(true)
  })

  it('never allows a request without MFA', () => {
    const baseline = scenarios.find((scenario) => scenario.id === 'baseline-manager-write')
    const result = evaluateRequest({ ...baseline.input, mfaPassed: false })

    expect(result.decision).not.toBe('Allow')
    expect(result.policyTrace.find((step) => step.id === 'mfa')?.outcome).toBe('fail')
  })

  it('fails closed for an unsupported action', () => {
    expect(() =>
      evaluateRequest({
        ...scenarios[0].input,
        action: 'Download Everything',
      }),
    ).toThrow(ValidationError)
  })

  it('never falls back to another owner for an unknown vault', () => {
    const result = evaluateRequest({
      ...scenarios.find((scenario) => scenario.id === 'vault-owner-valid').input,
      requesterName: 'Nobody',
      vaultOwner: 'Nobody',
    })

    expect(result.decision).toBe('Deny')
    expect(result.vaultView.ownerKnown).toBe(false)
    expect(result.vaultView.entries).toEqual([])
  })

  it('does not grant an administrator a private-vault bypass', () => {
    const result = evaluateRequest({
      ...scenarios.find((scenario) => scenario.id === 'vault-owner-valid').input,
      requesterRole: 'Admin',
    })

    expect(result.decision).toBe('Deny')
    expect(result.vaultView.decrypted).toBe(false)
  })

  it('requires the simulated owner-key signal to open a private vault', () => {
    const result = evaluateRequest({
      ...scenarios.find((scenario) => scenario.id === 'vault-owner-valid').input,
      ownerKeyPresent: false,
    })

    expect(result.decision).toBe('Deny')
    expect(result.vaultView.entries.every((entry) => entry.plaintext === null)).toBe(true)
  })
})
