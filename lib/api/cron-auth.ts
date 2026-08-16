import { NextRequest, NextResponse } from 'next/server'

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export type CronAuthResult = 'ok' | 'missing_env' | 'missing_header' | 'mismatch'

export function checkCronSecret(req: NextRequest): CronAuthResult {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return 'missing_env'

  const bearer = extractBearerToken(req.headers.get('authorization'))
  const headerSecret = req.headers.get('x-cron-secret')
  const provided = (bearer ?? headerSecret)?.trim()

  if (!provided) return 'missing_header'
  return provided === secret ? 'ok' : 'mismatch'
}

export function verifyCronSecret(req: NextRequest): boolean {
  return checkCronSecret(req) === 'ok'
}

export function cronAuthResponse(result: CronAuthResult): NextResponse | null {
  if (result === 'ok') return null
  if (result === 'missing_env') {
    return NextResponse.json(
      { error: 'CRON_SECRET non configuré sur le serveur (Netlify → Environment variables → redéployer)' },
      { status: 503 },
    )
  }
  if (result === 'missing_header') {
    return NextResponse.json(
      { error: 'Header Authorization: Bearer … ou x-cron-secret requis' },
      { status: 401 },
    )
  }
  return NextResponse.json({ error: 'Secret cron incorrect' }, { status: 401 })
}
