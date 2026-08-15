// Rate limiter en mémoire — suffisant pour une instance Netlify/serverless courte durée.
// En prod multi-instance, préférer Redis/Upstash.

const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count++
  return { allowed: true, retryAfterSec: 0 }
}
