import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/export
 *
 * Exportation 1-clic des données de l'entreprise (Conformité Loi 25 Québec).
 * Extrait en lecture seule les tables du tenant : company, clients, devis, factures, depenses, jobs, notes.
 * Accessible uniquement aux propriétaires et administrateurs.
 */
export async function GET(_req: NextRequest) {
  try {
    const { supabase, companyId, user } = await requireCompany()

    // Vérifier le rôle (propriétaire ou administrateur)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role ?? '').toLowerCase()
    const roleAutorise = ['propriétaire', 'owner', 'administrateur', 'admin']
    if (!roleAutorise.includes(role)) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs et propriétaires de l’entreprise.' },
        { status: 403 }
      )
    }

    const admin = createAdminClient()

    // Extraction en lecture seule des tables du tenant
    const [
      companyRes,
      clientsRes,
      devisRes,
      facturesRes,
      depensesRes,
      jobsRes,
      notesRes,
    ] = await Promise.all([
      admin.from('companies').select('*').eq('id', companyId).maybeSingle(),
      admin.from('clients').select('*').eq('company_id', companyId),
      admin.from('devis').select('*').eq('company_id', companyId),
      admin.from('factures').select('*').eq('company_id', companyId),
      admin.from('depenses').select('*').eq('company_id', companyId),
      admin.from('jobs').select('*').eq('company_id', companyId),
      admin.from('notes').select('*').eq('company_id', companyId),
    ])

    const dateStr = new Date().toISOString().split('T')[0]

    const exportPayload = {
      meta: {
        export_date: new Date().toISOString(),
        exported_by: user.email ?? user.id,
        company_id: companyId,
        loi_25: 'Exportation de données conforme à la Loi 25 du Québec (Droit à la portabilité)',
      },
      company: companyRes.data ?? null,
      clients: clientsRes.data ?? [],
      devis: devisRes.data ?? [],
      factures: facturesRes.data ?? [],
      depenses: depensesRes.data ?? [],
      jobs: jobsRes.data ?? [],
      notes: notesRes.data ?? [],
    }

    const filename = `export-erp-${dateStr}.json`

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return apiError(err, '[GET /api/account/export]')
  }
}
