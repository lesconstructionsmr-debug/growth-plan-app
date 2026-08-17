import { NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { inboxAddress } from '@/lib/depenses/match-job'

export const dynamic = 'force-dynamic'

function newKey() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

export async function GET() {
  try {
    const { companyId } = await requireCompanyAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('companies')
      .select('id, expenses_inbox_key')
      .eq('id', companyId)
      .single()

    if (error) {
      if (error.message?.includes('expenses_inbox_key') || error.code === '42703') {
        return NextResponse.json({
          address: '',
          ready: false,
          error: 'Colonne courriel manquante — lance la migration 0013.',
        })
      }
      throw error
    }

    let key = data.expenses_inbox_key as string | null
    if (!key) {
      key = newKey()
      const { error: upd } = await admin
        .from('companies')
        .update({ expenses_inbox_key: key })
        .eq('id', companyId)
      if (upd) throw upd
    }

    return NextResponse.json({
      address: inboxAddress(key),
      ready: true,
    })
  } catch (err) {
    return apiError(err, '[GET /api/company/expenses-inbox]')
  }
}
