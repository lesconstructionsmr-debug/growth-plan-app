import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ApiError, requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { isCompanyAdmin } from '@/lib/auth/permissions'

vi.mock('@/lib/api/supabase-server', () => ({
  createClient: vi.fn(),
}))

function mockSupabaseProfile(role: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { company_id: 'company-1', role },
          }),
        }),
      }),
    }),
  }
}

/** Routes CRM/finance whose mutations must call requireCompanyAdmin(). */
const ADMIN_ONLY_MUTATION_ROUTES = [
  'app/api/devis/route.ts',
  'app/api/devis/[id]/convertir/route.ts',
  'app/api/devis/[id]/envoyer/route.ts',
  'app/api/devis/[id]/relancer/route.ts',
  'app/api/factures/route.ts',
  'app/api/factures/[id]/relancer/route.ts',
  'app/api/clients/route.ts',
  'app/api/messages/route.ts',
  'app/api/reminders/route.ts',
  'app/api/notes/route.ts',
  'app/api/invitations/route.ts',
  'app/api/sous-traitants/route.ts',
  'app/api/sous-traitants/[id]/route.ts',
  'app/api/stripe/checkout/route.ts',
  'app/api/stripe/portal/route.ts',
] as const

describe('requireCompanyAdmin API guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuse collaborateur et employee avec 403', async () => {
    const { createClient } = await import('@/lib/api/supabase-server')

    for (const role of ['collaborateur', 'employee', 'employé']) {
      vi.mocked(createClient).mockReturnValue(mockSupabaseProfile(role) as never)

      await expect(requireCompanyAdmin()).rejects.toEqual(
        expect.objectContaining({
          status: 403,
          message: 'Accès réservé aux propriétaires et administrateurs',
        }),
      )
    }
  })

  it('autorise owner et admin', async () => {
    const { createClient } = await import('@/lib/api/supabase-server')

    for (const role of ['owner', 'admin']) {
      vi.mocked(createClient).mockReturnValue(mockSupabaseProfile(role) as never)

      const ctx = await requireCompanyAdmin()
      expect(ctx.companyId).toBe('company-1')
      expect(ctx.role).toBe(role)
      expect(isCompanyAdmin(ctx.role)).toBe(true)
    }
  })

  it('apiError propage ApiError 403 pour les employés', () => {
    const res = apiError(new ApiError(403, 'Accès réservé aux propriétaires et administrateurs'), '[test]')
    expect(res.status).toBe(403)
  })
})

describe('CRM/finance mutation routes enforce requireCompanyAdmin', () => {
  it.each(ADMIN_ONLY_MUTATION_ROUTES)('%s importe et utilise requireCompanyAdmin sur mutations', (routePath) => {
    const source = readFileSync(resolve(process.cwd(), routePath), 'utf8')

    expect(source).toContain('requireCompanyAdmin')
    expect(source).toMatch(/from '@\/lib\/api\/auth'/)

    const mutationHandlers = [...source.matchAll(/export async function (POST|PUT|PATCH|DELETE)/g)]
    expect(mutationHandlers.length).toBeGreaterThan(0)

    for (const [, method] of mutationHandlers) {
      const handlerStart = source.indexOf(`export async function ${method}`)
      const nextHandler = source.indexOf('export async function', handlerStart + 1)
      const handlerBody = nextHandler === -1
        ? source.slice(handlerStart)
        : source.slice(handlerStart, nextHandler)

      expect(handlerBody, `${routePath} ${method} should guard with requireCompanyAdmin`).toMatch(
        /requireCompanyAdmin\(\)/,
      )
    }
  })

  it('invitations GET est réservé aux admins', () => {
    const source = readFileSync(resolve(process.cwd(), 'app/api/invitations/route.ts'), 'utf8')
    const getHandler = source.slice(source.indexOf('export async function GET'))
    const postIndex = getHandler.indexOf('export async function POST')
    const getBody = postIndex === -1 ? getHandler : getHandler.slice(0, postIndex)

    expect(getBody).toMatch(/requireCompanyAdmin\(\)/)
  })
})
