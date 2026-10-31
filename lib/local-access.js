const loopbackAuthority = /^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/i

function localOrigin(authority, protocol) {
  const match = loopbackAuthority.exec(authority || '')
  if (!match || (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))) return null
  return new URL(`${protocol}//${authority}`).origin
}

// This application has one shared demo database and no user authentication.
// Host validation complements loopback binding and prevents DNS rebinding.
// Forwarding headers are intentionally never trusted as an access boundary.
export function isLocalRequest(request) {
  let url
  try {
    url = new URL(request.url)
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(url.protocol)) return false
  const origin = localOrigin(request.headers.get('host') || url.host, url.protocol)
  if (!origin) return false

  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false

  const suppliedOrigin = request.headers.get('origin')
  if (suppliedOrigin !== null && suppliedOrigin !== origin) return false
  return true
}
