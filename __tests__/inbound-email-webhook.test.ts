import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/webhooks/inbound-email/route'
import { NextRequest } from 'next/server'

// Mock Supabase admin
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'client-123',
                  company_id: 'comp-456',
                  nom: 'Tremblay Rénovations',
                  email: 'client@tremblay.ca',
                },
                error: null,
              }),
            })),
          })),
        }
      }
      if (table === 'notes') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { id: 'note-789', created_at: new Date().toISOString() },
                error: null,
              }),
            })),
          })),
        }
      }
      return {}
    }),
  })),
}))

describe('POST /api/webhooks/inbound-email', () => {
  it('intercepte le courriel entrant et l\'associe au bon client', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/inbound-email', {
      method: 'POST',
      body: JSON.stringify({
        from: 'Tremblay Rénovations <client@tremblay.ca>',
        subject: 'Re: Devis DEV-2026-001',
        text: 'Bonjour, nous acceptons la soumission !',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.matched).toBe(true)
    expect(json.clientId).toBe('client-123')
    expect(json.clientNom).toBe('Tremblay Rénovations')
  })

  it('gère les emails sans expéditeur valide', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/inbound-email', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Spam sans from',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
