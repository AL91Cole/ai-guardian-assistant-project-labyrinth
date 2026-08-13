const globalForRateLimit = globalThis
const buckets = globalForRateLimit.__labyrinthRateLimits ?? new Map()
const maximumBuckets = 1_000

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.__labyrinthRateLimits = buckets
}

function getClientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const address = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
  return address.slice(0, 120)
}

function makeRoomForBucket(now) {
  for (const [candidateKey, candidate] of buckets) {
    if (candidate.resetAt <= now) buckets.delete(candidateKey)
  }

  while (buckets.size >= maximumBuckets) {
    const oldestKey = buckets.keys().next().value
    if (oldestKey === undefined) break
    buckets.delete(oldestKey)
  }
}

export function consumeRateLimit(request, { bucket = 'default', limit = 60, windowMs = 60_000 } = {}) {
  const now = Date.now()
  const key = `${bucket}:${getClientKey(request)}`
  const existing = buckets.get(key)

  if (!existing && buckets.size >= maximumBuckets) makeRoomForBucket(now)

  const entry = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing

  entry.count += 1
  buckets.set(key, entry)

  return { allowed: entry.count <= limit, limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}

export function getRateLimitHeaders(result) {
  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
