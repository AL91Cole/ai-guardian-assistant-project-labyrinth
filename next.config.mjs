import { getSecurityHeaders } from './lib/security-headers.js'

const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['better-sqlite3'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: getSecurityHeaders(),
      },
    ]
  },
}

export default nextConfig
