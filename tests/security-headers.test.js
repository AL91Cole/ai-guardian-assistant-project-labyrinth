import { describe, expect, it } from 'vitest'
import { getContentSecurityPolicy, getSecurityHeaders } from '../lib/security-headers.js'

describe('security headers', () => {
  it('permits React debugging eval only in development', () => {
    expect(getContentSecurityPolicy('development')).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    )
    expect(getContentSecurityPolicy('production')).not.toContain("'unsafe-eval'")
  })

  it('keeps the defensive headers and production CSP in place', () => {
    const headers = Object.fromEntries(
      getSecurityHeaders('production').map(({ key, value }) => [key, value]),
    )

    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'")
    expect(headers['Content-Security-Policy']).not.toContain("'unsafe-eval'")
  })
})
