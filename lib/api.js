import { NextResponse } from 'next/server'
import { getRateLimitHeaders } from './rate-limit.js'
import { ValidationError } from './validation.js'

const maximumJsonBodyBytes = 32 * 1024

export async function readJsonBody(request) {
  const contentType = request.headers.get('content-type') || ''
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()
  if (mediaType !== 'application/json' && !mediaType.endsWith('+json')) {
    throw new ValidationError('Content-Type must be application/json.', [
      { field: 'content-type', message: 'Expected application/json.' },
    ])
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maximumJsonBodyBytes) {
    throw new ValidationError('The JSON request body is too large.', [
      { field: 'body', message: `Must be ${maximumJsonBodyBytes} bytes or fewer.` },
    ])
  }

  try {
    const body = await request.text()
    if (new TextEncoder().encode(body).byteLength > maximumJsonBodyBytes) {
      throw new ValidationError('The JSON request body is too large.', [
        { field: 'body', message: `Must be ${maximumJsonBodyBytes} bytes or fewer.` },
      ])
    }
    return JSON.parse(body)
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError('The request body is not valid JSON.', [
      { field: 'body', message: 'Provide a valid JSON object.' },
    ])
  }
}

export function errorResponse(error, { headers = {} } = {}) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request', message: error.message, issues: error.issues },
      { status: 400, headers },
    )
  }

  console.error('Project Labyrinth API error', error)
  return NextResponse.json(
    { ok: false, error: 'Internal server error', message: 'The simulation could not complete the request.' },
    { status: 500, headers },
  )
}

export function rateLimitResponse(result) {
  return NextResponse.json(
    { ok: false, error: 'Rate limit exceeded', message: 'Wait for the current simulation window to reset.' },
    { status: 429, headers: getRateLimitHeaders(result) },
  )
}
