import { NextResponse } from 'next/server'
import { getRateLimitHeaders } from './rate-limit.js'
import { ValidationError } from './validation.js'
import { isLocalRequest } from './local-access.js'

const maximumJsonBodyBytes = 32 * 1024

export function rejectNonLocalRequest(request) {
  if (isLocalRequest(request)) return null
  return NextResponse.json(
    { ok: false, error: 'Forbidden', message: 'This demonstration accepts local, same-origin requests only.' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  )
}

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
    const reader = request.body?.getReader()
    const chunks = []
    let size = 0
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > maximumJsonBodyBytes) {
            // Stop consuming chunked bodies as soon as the limit is crossed.
            // Do not wait for an untrusted producer to acknowledge cancellation.
            void reader.cancel().catch(() => {})
            throw new ValidationError('The JSON request body is too large.', [
              { field: 'body', message: `Must be ${maximumJsonBodyBytes} bytes or fewer.` },
            ])
          }
          chunks.push(value)
        }
      } finally {
        reader.releaseLock()
      }
    }
    const body = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body))
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError('The request body is not valid JSON.', [
      { field: 'body', message: 'Provide a valid JSON object.' },
    ])
  }
}

export function errorResponse(error, { headers = {} } = {}) {
  headers = { 'Cache-Control': 'no-store', ...headers }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { ok: false, error: 'Invalid request', message: error.message, issues: error.issues },
      { status: 400, headers },
    )
  }

  // Error objects can contain submitted values or database paths.
  console.error('Project Labyrinth API request failed.')
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
