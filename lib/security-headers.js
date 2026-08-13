export function getContentSecurityPolicy(nodeEnv = process.env.NODE_ENV) {
  const scriptSources = ["'self'", "'unsafe-inline'"]

  // React development tooling uses eval to reconstruct debugging call stacks.
  // Keep that exception out of production responses.
  if (nodeEnv === 'development') {
    scriptSources.push("'unsafe-eval'")
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
  ].join('; ')
}

export function getSecurityHeaders(nodeEnv = process.env.NODE_ENV) {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=()',
    },
    {
      key: 'Content-Security-Policy',
      value: getContentSecurityPolicy(nodeEnv),
    },
  ]
}
