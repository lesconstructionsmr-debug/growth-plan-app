import { getSiteUrl } from '@/lib/auth/site-url'

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildAuthCallbackUrl(tokenHash: string, type: string, siteUrl = getSiteUrl()) {
  const url = new URL(`${siteUrl.replace(/\/$/, '')}/auth/callback`)
  url.searchParams.set('token_hash', tokenHash)
  url.searchParams.set('type', type)
  return url.toString()
}
