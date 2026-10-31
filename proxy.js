import { NextResponse } from 'next/server'
import { isLocalRequest } from './lib/local-access.js'

export function proxy(request) {
  const response = isLocalRequest(request)
    ? NextResponse.next()
    : NextResponse.json(
        { ok: false, error: 'Forbidden', message: 'This demonstration accepts local, same-origin requests only.' },
        { status: 403 },
      )
  response.headers.set('Cache-Control', 'no-store')
  return response
}

// API handlers guard access themselves, before reading their raw body stream.
// Keeping them out of Proxy avoids Next.js body-clone buffering/truncation.
export const config = { matcher: '/((?!api(?:/|$)).*)' }
