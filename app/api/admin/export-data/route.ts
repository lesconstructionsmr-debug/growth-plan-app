import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/export-data
 *
 * Loi 25 Québec — Droit à la portabilité des données personnelles.
 * Exporte toutes les données de l'entreprise connectée en un seul fichier JSON.
 * Accessible uniquement aux propriétaires et administrateurs de la compagnie.
 */
export async function GET(_req: NextRequest) {
  try {
    const { supabase, companyId, user } = await requireCompany()
    const admin = createAdminClient()

    // Vérifier le rôle (propriétaire ou admin seulement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const roleAutorise = ['propriétaire', 'owner', 'administrateur', 'admin']
    if (!profile || !roleAutorise.includes(profile.role ?? '')) {
      return NextResponse.json(
        { error: 'Accès réservé au propriétaire ou administrateur de la compagnie.' },
        { status: 403 }
      )
    }

    // ── Collecter toutes les tables métier ──────────────────────────
    const [
      company,
      profiles,
      clients,
      jobs,
      devis,
      factures,
      leads,
      employes,
      depenses,
      notes,
      invitations,
      subscriptions,
    ] = await Promise.all([
      admin.from('companies').select('*').eq('id', companyId).single(),
      admin.from('profiles').select('id, full_name, role, created_at').eq('company_id', companyId),
      admin.from('clients').select('*').eq('company_id', companyId),
      admin.from('jobs').select('*').eq('company_id', companyId),
      admin.from('devis').select('*').eq('company_id', companyId),
      admin.from('factures').select('*').eq('company_id', companyId),
      admin.from('leads').select('*').eq('company_id', companyId),
      admin.from('employes').select('*').eq('company_id', companyId),
      admin.from('depenses').select('*').eq('company_id', companyId),
      admin.from('notes').select('*').eq('company_id', companyId),
      admin.from('invitations').select('id, email, role, accepted, created_at, expires_at').eq('company_id', companyId),
      admin.from('subscriptions').select('status, plan, trial_end, current_period_end, created_at').eq('company_id', companyId),
    ])

    const exportData = {
      meta: {
        export_date: new Date().toISOString(),
        exported_by: user.email,
        loi_25: 'Exportation générée conformément à la Loi 25 du Québec (droit à la portabilité)',
        company_id: companyId,
      },
      company: company.data,
      utilisateurs: profiles.data ?? [],
      clients: clients.data ?? [],
      chantiers: jobs.data ?? [],
      devis: devis.data ?? [],
      factures: factures.data ?? [],
      leads: leads.data ?? [],
      employes: employes.data ?? [],
      depenses: depenses.data ?? [],
      notes: notes.data ?? [],
      invitations: invitations.data ?? [],
      abonnement: subscriptions.data ?? [],
    }

    const filename = `growth-plan-export-${companyId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/export-data]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
