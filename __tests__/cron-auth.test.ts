import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { verifyCronSecret } from '@/lib/api/cron-auth'
import { verifyWebhookSecret } from '@/lib/api/webhook-auth'

function mockRequest(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get(name: string) {
        const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
        return key ? headers[key] : null
      },
    },
  } as NextRequest
}

describe('verifyCronSecret', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret')
  })

  it('accepte Authorization Bearer valide', () => {
    const req = mockRequest({ authorization: 'Bearer test-cron-secret' })
    expect(verifyCronSecret(req)).toBe(true)
  })

  it('accepte x-cron-secret valide', () => {
    const req = mockRequest({ 'x-cron-secret': 'test-cron-secret' })
    expect(verifyCronSecret(req)).toBe(true)
  })

  it('rejette un secret manquant ou incorrect', () => {
    expect(verifyCronSecret(mockRequest({}))).toBe(false)
    expect(verifyCronSecret(mockRequest({ authorization: 'Bearer wrong' }))).toBe(false)
  })

  it('rejette si CRON_SECRET non configuré', () => {
    vi.stubEnv('CRON_SECRET', '')
    expect(verifyCronSecret(mockRequest({ 'x-cron-secret': 'test-cron-secret' }))).toBe(false)
  })
})

describe('verifyWebhookSecret', () => {
  beforeEach(() => {
    vi.stubEnv('LEADS_WEBHOOK_SECRET', 'test-webhook-secret')
  })

  it('accepte Authorization Bearer valide', () => {
    const req = mockRequest({ authorization: 'Bearer test-webhook-secret' })
    expect(verifyWebhookSecret(req)).toBe(true)
  })

  it('accepte x-webhook-secret valide', () => {
    const req = mockRequest({ 'x-webhook-secret': 'test-webhook-secret' })
    expect(verifyWebhookSecret(req)).toBe(true)
  })

  it('rejette un secret manquant ou incorrect', () => {
    expect(verifyWebhookSecret(mockRequest({}))).toBe(false)
    expect(verifyWebhookSecret(mockRequest({ 'x-webhook-secret': 'wrong' }))).toBe(false)
  })

  it('rejette si LEADS_WEBHOOK_SECRET non configuré', () => {
    vi.stubEnv('LEADS_WEBHOOK_SECRET', '')
    expect(verifyWebhookSecret(mockRequest({ authorization: 'Bearer test-webhook-secret' }))).toBe(false)
  })
})
