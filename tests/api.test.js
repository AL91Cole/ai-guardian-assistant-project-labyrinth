import { describe, expect, it } from 'vitest'
import { readJsonBody } from '../lib/api.js'
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
})
