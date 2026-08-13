import { describe, expect, it } from 'vitest'
import {
  ValidationError,
  validateAccessRequest,
  validateAlertUpdate,
  validatePositiveInteger,
} from '../lib/validation.js'

describe('request validation', () => {
  it('rejects non-object request bodies', () => {
    expect(() => validateAccessRequest([])).toThrow(ValidationError)
  })

  it('rejects unknown enum values and out-of-range signals', () => {
    expect(() =>
      validateAccessRequest({
        requesterRole: 'Root',
        action: 'Execute',
        anomalyScore: 101,
      }),
    ).toThrow(ValidationError)
  })

  it('accepts explicit boolean strings while normalizing request inputs', () => {
    const input = validateAccessRequest({ mfaPassed: 'true', trustedDevice: 'false' })

    expect(input.mfaPassed).toBe(true)
    expect(input.trustedDevice).toBe(false)
  })

  it('requires an alert update to contain a supported field', () => {
    expect(() => validateAlertUpdate({})).toThrow(ValidationError)
    expect(validateAlertUpdate({ status: 'Contained' })).toEqual({ status: 'Contained' })
    expect(validateAlertUpdate({ notes: '  ' })).toEqual({ notes: '' })
  })

  it('rejects invalid record identifiers', () => {
    expect(() => validatePositiveInteger('0')).toThrow(ValidationError)
    expect(validatePositiveInteger('42')).toBe(42)
  })
})
