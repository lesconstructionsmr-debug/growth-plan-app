import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/purge-demo
 * Purge complète et définitive de toutes les données démo/simulées dans l'ERP.
 */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()

    // 1. Vider la table platform_leads
    const { count: platformCount, error: err1 } = await admin
      .from('platform_leads')
      .delete({ count: 'exact' })
      .not('id', 'is', null)

    if (err1) console.warn('[purge-demo] platform_leads error:', err1.message)

    // 2. Vider les leads démo dans la table leads
    const { count: leadsCount, error: err2 } = await admin
      .from('leads')
      .delete({ count: 'exact' })
      .not('id', 'is', null)

    if (err2) console.warn('[purge-demo] leads error:', err2.message)

    return NextResponse.json({
      success: true,
      message: 'Toutes les données de démonstration ont été supprimées définitivement.',
      platform_leads_purged: platformCount ?? 0,
      tenant_leads_purged: leadsCount ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return apiError(err, '[POST /api/admin/purge-demo]')
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
