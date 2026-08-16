import { NextRequest } from 'next/server'

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.LEADS_WEBHOOK_SECRET
  if (!secret) return false

  const bearer = extractBearerToken(req.headers.get('authorization'))
  const headerSecret = req.headers.get('x-webhook-secret')
  const provided = bearer ?? headerSecret

  if (!provided) return false
  return provided === secret
}
