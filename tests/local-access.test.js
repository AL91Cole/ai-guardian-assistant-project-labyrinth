import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { isLocalRequest } from '../lib/local-access.js'
import { proxy } from '../proxy.js'

function request(host = '127.0.0.1:3000', headers = {}) {
  return new NextRequest('http://127.0.0.1:3000/api/logs', { headers: { host, ...headers } })
}

describe('local demonstration boundary', () => {
  it('accepts loopback hosts and exact same-origin browser requests', () => {
    for (const host of ['localhost:3000', '127.0.0.1:3000', '[::1]:3000']) {
      expect(isLocalRequest(request(host, { origin: `http://${host}`, 'sec-fetch-site': 'same-origin' }))).toBe(true)
    }
    expect(isLocalRequest(request())).toBe(true)
  })

  it('rejects rebinding hosts, lookalikes and malformed authorities', () => {
    for (const host of ['attacker.example', 'localhost.attacker.example', '127.0.0.1.attacker.example',
      'localhost@attacker.example', 'localhost/path', 'localhost:99999', '0.0.0.0:3000']) {
      expect(isLocalRequest(request(host))).toBe(false)
    }
  })

  it('rejects cross-origin access even when forwarding headers claim a local caller', () => {
    expect(isLocalRequest(request('127.0.0.1:3000', { origin: 'https://attacker.example',
      'x-forwarded-host': '127.0.0.1:3000', 'x-forwarded-for': '127.0.0.1' }))).toBe(false)
    for (const origin of ['null', 'http://localhost:3000', 'http://127.0.0.1:3001']) {
      expect(isLocalRequest(request('127.0.0.1:3000', { origin }))).toBe(false)
    }
    for (const fetchSite of ['cross-site', 'same-site']) {
      expect(isLocalRequest(request('127.0.0.1:3000', { 'sec-fetch-site': fetchSite }))).toBe(false)
    }
  })

  it('denies foreign requests before routing and disables caching', () => {
    const blocked = proxy(request('attacker.example'))
    expect(blocked.status).toBe(403)
    expect(blocked.headers.get('cache-control')).toBe('no-store')
    const allowed = proxy(request())
    expect(allowed.headers.get('x-middleware-next')).toBe('1')
    expect(allowed.headers.get('cache-control')).toBe('no-store')
  })
})
