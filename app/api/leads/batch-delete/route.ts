import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const body = await req.json().catch(() => ({}))
    const { ids } = body as { ids?: string[] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Liste d\'identifiants requise' }, { status: 400 })
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .in('id', ids)
      .eq('company_id', companyId)

    if (error) throw error

    return NextResponse.json({ success: true, count: ids.length })
  } catch (err) {
    return apiError(err, '[POST /api/leads/batch-delete]')
  }
}
