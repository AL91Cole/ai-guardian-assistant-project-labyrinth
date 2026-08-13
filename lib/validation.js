import {
  actionOptions,
  deviceComplianceOptions,
  identityStatusOptions,
  networkZoneOptions,
  resourceOptions,
  roleOptions,
} from './policies.js'

const resourceValues = resourceOptions.map((resource) => resource.value)

export const alertStatusOptions = ['New', 'Investigating', 'Contained', 'Closed']
export const alertDispositionOptions = ['Unreviewed', 'True Positive', 'Benign', 'False Positive']

export class ValidationError extends Error {
  constructor(message, issues = []) {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
  }
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function cleanText(value, fallback, field, issues, maxLength = 80) {
  const candidate = value === undefined || value === null ? fallback : value
  if (typeof candidate !== 'string') {
    issues.push({ field, message: 'Must be text.' })
    return fallback
  }

  const cleaned = candidate.trim()
  if (!cleaned) issues.push({ field, message: 'Cannot be empty.' })
  if (cleaned.length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` })
  }
  return cleaned.slice(0, maxLength)
}

function cleanOptionalText(value, fallback, field, issues, maxLength = 500) {
  const candidate = value === undefined || value === null ? fallback : value
  if (typeof candidate !== 'string') {
    issues.push({ field, message: 'Must be text.' })
    return fallback
  }

  const cleaned = candidate.trim()
  if (cleaned.length > maxLength) {
    issues.push({ field, message: `Must be ${maxLength} characters or fewer.` })
  }
  return cleaned.slice(0, maxLength)
}

function enumValue(value, fallback, allowed, field, issues) {
  const candidate = value === undefined || value === null ? fallback : value
  if (!allowed.includes(candidate)) {
    issues.push({ field, message: `Must be one of: ${allowed.join(', ')}.` })
    return fallback
  }
  return candidate
}

function booleanValue(value, fallback, field, issues) {
  const candidate = value === undefined || value === null ? fallback : value
  if (candidate === true || candidate === false) return candidate
  if (candidate === 'true') return true
  if (candidate === 'false') return false
  issues.push({ field, message: 'Must be true or false.' })
  return fallback
}

function integerValue(value, fallback, min, max, field, issues) {
  const candidate = value === undefined || value === null ? fallback : Number(value)
  if (!Number.isInteger(candidate) || candidate < min || candidate > max) {
    issues.push({ field, message: `Must be an integer from ${min} through ${max}.` })
    return fallback
  }
  return candidate
}

export const accessRequestDefaults = {
  requesterRole: 'Employee',
  requesterName: 'Jordan',
  vaultOwner: 'Jordan',
  resource: 'shared-files',
  action: 'Read',
  mfaPassed: false,
  trustedDevice: false,
  unusualLocation: false,
  anomalyScore: 0,
  identityStatus: 'Active',
  deviceCompliance: 'Compliant',
  networkZone: 'Corporate',
  sessionAgeMinutes: 15,
  failedAttempts: 0,
  ownerKeyPresent: false,
  scenarioId: null,
}

export function validateAccessRequest(payload = {}, { allowDefaults = true } = {}) {
  if (!isPlainObject(payload)) {
    throw new ValidationError('The request body must be a JSON object.', [
      { field: 'body', message: 'Expected a JSON object.' },
    ])
  }

  const issues = []
  const fallback = allowDefaults ? accessRequestDefaults : {}
  const scenarioId =
    payload.scenarioId === undefined || payload.scenarioId === null || payload.scenarioId === ''
      ? null
      : cleanText(payload.scenarioId, '', 'scenarioId', issues, 80)

  const data = {
    requesterRole: enumValue(payload.requesterRole, fallback.requesterRole, roleOptions, 'requesterRole', issues),
    requesterName: cleanText(payload.requesterName, fallback.requesterName, 'requesterName', issues, 80),
    vaultOwner: cleanText(payload.vaultOwner, fallback.vaultOwner, 'vaultOwner', issues, 80),
    resource: enumValue(payload.resource, fallback.resource, resourceValues, 'resource', issues),
    action: enumValue(payload.action, fallback.action, actionOptions, 'action', issues),
    mfaPassed: booleanValue(payload.mfaPassed, fallback.mfaPassed, 'mfaPassed', issues),
    trustedDevice: booleanValue(payload.trustedDevice, fallback.trustedDevice, 'trustedDevice', issues),
    unusualLocation: booleanValue(payload.unusualLocation, fallback.unusualLocation, 'unusualLocation', issues),
    anomalyScore: integerValue(payload.anomalyScore, fallback.anomalyScore, 0, 100, 'anomalyScore', issues),
    identityStatus: enumValue(
      payload.identityStatus,
      fallback.identityStatus,
      identityStatusOptions,
      'identityStatus',
      issues,
    ),
    deviceCompliance: enumValue(
      payload.deviceCompliance,
      fallback.deviceCompliance,
      deviceComplianceOptions,
      'deviceCompliance',
      issues,
    ),
    networkZone: enumValue(payload.networkZone, fallback.networkZone, networkZoneOptions, 'networkZone', issues),
    sessionAgeMinutes: integerValue(
      payload.sessionAgeMinutes,
      fallback.sessionAgeMinutes,
      0,
      1440,
      'sessionAgeMinutes',
      issues,
    ),
    failedAttempts: integerValue(payload.failedAttempts, fallback.failedAttempts, 0, 50, 'failedAttempts', issues),
    ownerKeyPresent: booleanValue(
      payload.ownerKeyPresent,
      fallback.ownerKeyPresent,
      'ownerKeyPresent',
      issues,
    ),
    scenarioId,
  }

  if (issues.length) {
    throw new ValidationError('One or more access-request fields are invalid.', issues)
  }

  return data
}

export function validateAlertUpdate(payload = {}) {
  if (!isPlainObject(payload)) {
    throw new ValidationError('The alert update must be a JSON object.')
  }

  const issues = []
  const data = {}

  if (payload.status !== undefined) {
    data.status = enumValue(payload.status, 'New', alertStatusOptions, 'status', issues)
  }
  if (payload.disposition !== undefined) {
    data.disposition = enumValue(
      payload.disposition,
      'Unreviewed',
      alertDispositionOptions,
      'disposition',
      issues,
    )
  }
  if (payload.assignee !== undefined) {
    data.assignee = cleanText(payload.assignee, 'Unassigned', 'assignee', issues, 80)
  }
  if (payload.notes !== undefined) {
    data.notes = cleanOptionalText(payload.notes, '', 'notes', issues, 500)
  }

  if (!Object.keys(data).length) {
    issues.push({ field: 'body', message: 'Provide at least one alert field to update.' })
  }

  if (issues.length) {
    throw new ValidationError('One or more alert fields are invalid.', issues)
  }

  return data
}

export function validatePositiveInteger(value, field = 'id') {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${field} must be a positive integer.`, [
      { field, message: 'Must be a positive integer.' },
    ])
  }
  return parsed
}
