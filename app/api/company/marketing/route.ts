import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EMPTY_BUDGETS, type Channel, type MarketingBudgets } from '@/lib/leads/acquisition'

export const dynamic = 'force-dynamic'

const KEYS: Channel[] = ['google', 'meta', 'site', 'autre']

function normalize(raw: unknown): MarketingBudgets {
  const src = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const out = { ...EMPTY_BUDGETS }
  for (const k of KEYS) {
    const n = Number(src[k])
    out[k] = Number.isFinite(n) && n >= 0 ? Math.round(n) : 0
  }
  return out
}

export async function GET() {
  try {
    const { companyId } = await requireCompany()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('companies')
      .select('marketing_budgets')
      .eq('id', companyId)
      .single()

    if (error) {
      if (error.message?.includes('marketing_budgets') || error.code === '42703') {
        return NextResponse.json({ budgets: EMPTY_BUDGETS, persisted: false })
      }
      throw error
    }

    return NextResponse.json({
      budgets: normalize(data?.marketing_budgets),
      persisted: true,
    })
  } catch (err) {
    return apiError(err, '[GET /api/company/marketing]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { companyId } = await requireCompany()
    const body = await req.json().catch(() => ({}))
    const budgets = normalize(body.budgets ?? body)
    const admin = createAdminClient()

    const { error } = await admin
      .from('companies')
      .update({ marketing_budgets: budgets })
      .eq('id', companyId)

    if (error) {
      if (error.message?.includes('marketing_budgets') || error.code === '42703') {
        return NextResponse.json({
          budgets,
          persisted: false,
          error: 'Colonne budgets manquante — les chiffres restent sur cet appareil seulement.',
        }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ budgets, persisted: true })
  } catch (err) {
    return apiError(err, '[PATCH /api/company/marketing]')
  }
}
