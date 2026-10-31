import { describe, expect, it, vi } from 'vitest'
import { errorResponse, readJsonBody } from '../lib/api.js'
import { ValidationError } from '../lib/validation.js'

function jsonRequest(body, contentType = 'application/json') {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })
}

describe('JSON API body handling', () => {
  it('parses standard and structured JSON media types', async () => {
    await expect(readJsonBody(jsonRequest('{"ok":true}'))).resolves.toEqual({ ok: true })
    await expect(readJsonBody(jsonRequest('{"ok":true}', 'application/problem+json'))).resolves.toEqual({
      ok: true,
    })
  })

  it('rejects misleading content types and malformed JSON', async () => {
    await expect(readJsonBody(jsonRequest('{}', 'text/application/json'))).rejects.toBeInstanceOf(
      ValidationError,
    )
    await expect(readJsonBody(jsonRequest('{broken'))).rejects.toBeInstanceOf(ValidationError)
  })

  it('rejects oversized bodies before policy evaluation', async () => {
    const body = JSON.stringify({ padding: 'x'.repeat(33 * 1024) })

    await expect(readJsonBody(jsonRequest(body))).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'The JSON request body is too large.',
    })
  })

  it('stops an undeclared stream at the byte limit and cancels its producer', async () => {
    let cancelled = false
    let produced = 0
    const stream = new ReadableStream({
      pull(controller) {
        produced += 1
        controller.enqueue(new Uint8Array(1024))
      },
      cancel() {
        cancelled = true
      },
    })
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: stream,
      duplex: 'half',
    })
    await expect(readJsonBody(request)).rejects.toMatchObject({ message: 'The JSON request body is too large.' })
    expect(cancelled).toBe(true)
    expect(produced).toBeLessThanOrEqual(34)
  })

  it('counts UTF-8 bytes rather than characters and rejects invalid UTF-8', async () => {
    await expect(readJsonBody(jsonRequest(JSON.stringify({ text: '😀'.repeat(9000) }))))
      .rejects.toMatchObject({ message: 'The JSON request body is too large.' })
    const invalidUtf8 = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125]),
    })
    await expect(readJsonBody(invalidUtf8)).rejects.toBeInstanceOf(ValidationError)
  })

  it('does not echo unexpected error details into logs or API responses', async () => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = errorResponse(new Error('private submitted value and local database path'))
      expect(response.status).toBe(500)
      expect(await response.text()).not.toContain('private submitted value')
      expect(logger).toHaveBeenCalledExactlyOnceWith('Project Labyrinth API request failed.')
    } finally {
      logger.mockRestore()
    }
  })
})
