import { describe, expect, it } from 'vitest'
import { getPermissionLevel, policyMatrix } from '../lib/policies.js'

describe('policy inheritance', () => {
  it('inherits shared-file permissions into super-secret files', () => {
    expect(getPermissionLevel('Executive', 'super-secret-files')).toBe('full')
    expect(getPermissionLevel('Manager', 'super-secret-files')).toBe('read')
  })

  it('does not translate technical administration into data access', () => {
    for (const policy of policyMatrix) {
      expect(policy.permissions.Admin).toBe('none')
    }
  })

  it('fails closed for unknown roles and resources', () => {
    expect(getPermissionLevel('Unknown', 'shared-files')).toBe('none')
    expect(getPermissionLevel('Manager', 'unknown-resource')).toBe('none')
  })
})
