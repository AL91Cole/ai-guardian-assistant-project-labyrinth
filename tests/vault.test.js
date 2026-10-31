import { describe, expect, it } from 'vitest'
import { getVaultSimulation, isKnownVaultOwner } from '../lib/vault.js'

describe('vault owner lookup', () => {
  it('treats inherited JavaScript object names as unknown vault owners', () => {
    for (const vaultOwner of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(isKnownVaultOwner(vaultOwner)).toBe(false)
      expect(getVaultSimulation({ vaultOwner, requesterName: vaultOwner, requesterRole: 'Employee',
        allowed: true, ownerKeyPresent: true })).toMatchObject({ ownerKnown: false, decrypted: false, entries: [] })
    }
  })
})
