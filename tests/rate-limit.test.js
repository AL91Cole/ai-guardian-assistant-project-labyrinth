import { describe, expect, it } from 'vitest'
import { consumeRateLimit, getRateLimitHeaders } from '../lib/rate-limit.js'

function requestFrom(address) {
  return new Request('http://localhost/api/test', {
    headers: { 'X-Forwarded-For': address },
  })
}

describe('demo rate limiter', () => {
  it('tracks independent buckets and rejects requests beyond the limit', () => {
    const request = requestFrom('192.0.2.10')
    const options = { bucket: 'unit-test-limit', limit: 2, windowMs: 60_000 }

    expect(consumeRateLimit(request, options)).toMatchObject({ allowed: true, remaining: 1 })
    expect(consumeRateLimit(request, options)).toMatchObject({ allowed: true, remaining: 0 })
    expect(consumeRateLimit(request, options)).toMatchObject({ allowed: false, remaining: 0 })
    expect(consumeRateLimit(requestFrom('192.0.2.11'), options)).toMatchObject({
      allowed: false,
      remaining: 0,
    })
  })

  it('does not let forged forwarding headers reset the shared local quota', () => {
    const options = { bucket: 'unit-test-forged-headers', limit: 1 }
    expect(consumeRateLimit(requestFrom('192.0.2.20'), options).allowed).toBe(true)
    const forged = new Request('http://localhost/api/test', {
      headers: { 'X-Forwarded-For': '198.51.100.1', 'X-Real-IP': '203.0.113.1' },
    })
    expect(consumeRateLimit(forged, options).allowed).toBe(false)
    expect(consumeRateLimit(forged, { ...options, bucket: 'unit-test-separate-route' }).allowed).toBe(true)
  })

  it('formats the response quota headers', () => {
    const result = consumeRateLimit(requestFrom('192.0.2.12'), {
      bucket: 'unit-test-headers',
      limit: 5,
      windowMs: 60_000,
    })

    expect(getRateLimitHeaders(result)).toMatchObject({
      'RateLimit-Limit': '5',
      'RateLimit-Remaining': '4',
    })
  })
})
