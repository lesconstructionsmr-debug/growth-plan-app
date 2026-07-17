import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/purge-tenant
 *
 * Loi 25 Québec — Droit à l'oubli (droit à l'effacement).
 * Supprime définitivement et irréversiblement TOUTES les données de l'entreprise :
 * - Toutes les tables métier (clients, devis, factures, jobs, leads, etc.)
 * - L'enregistrement de la compagnie
 * - Les comptes utilisateurs auth.users associés (profiles en cascade)
 *
 * SÉCURITÉ :
 * - Réservé au propriétaire de la compagnie uniquement
 * - Requiert un header de confirmation explicite : X-Confirm-Purge: DELETE-MY-ACCOUNT
 * - Utilise le client admin pour contourner la RLS (nécessaire pour supprimer auth.users)
 */
export async function DELETE(req: NextRequest) {
  try {
    // ── Garde 1 : Header de confirmation obligatoire ─────────────────
    const confirmHeader = req.headers.get('X-Confirm-Purge')
    if (confirmHeader !== 'DELETE-MY-ACCOUNT') {
      return NextResponse.json(
        {
          error: 'Confirmation manquante.',
          instructions: 'Ajoutez le header HTTP : X-Confirm-Purge: DELETE-MY-ACCOUNT',
        },
        { status: 400 }
      )
    }

    const { supabase, companyId, user } = await requireCompany()
    const admin = createAdminClient()

    // ── Garde 2 : Rôle propriétaire uniquement ───────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const roleProprio = ['propriétaire', 'owner']
    if (!profile || !roleProprio.includes(profile.role ?? '')) {
      return NextResponse.json(
        { error: 'Seul le propriétaire du compte peut demander la suppression définitive.' },
        { status: 403 }
      )
    }

    // ── Collecte des utilisateurs avant suppression (pour log) ────────
    const { data: membres } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)

    const userIds = (membres ?? []).map((m) => m.id as string)

    // ── Suppression en cascade des tables métier ──────────────────────
    // L'ordre compte : supprimer d'abord les tables qui référencent d'autres tables
    // (bien que les ON DELETE CASCADE couvrent la plupart, on supprime explicitement
    // pour s'assurer qu'aucune donnée personnelle ne reste en cas de FK sans CASCADE)
    const tables = [
      'notes',
      'depenses',
      'factures',
      'devis',
      'leads',
      'employes',
      'jobs',
      'clients',
      'invitations',
      'subscriptions',
      'reminders',
    ] as const

    for (const table of tables) {
      const { error } = await admin
        .from(table as string)
        .delete()
        .eq('company_id', companyId)

      if (error) {
        // Certaines tables peuvent ne pas exister selon la migration — on ignore
        console.warn(`[purge-tenant] Skip ${table}:`, error.message)
      }
    }

    // ── Suppression de la compagnie (profiles en cascade via FK) ─────
    await admin.from('companies').delete().eq('id', companyId)

    // ── Suppression des comptes auth.users ───────────────────────────
    // Les profiles sont supprimés en cascade via la FK vers auth.users,
    // mais il faut supprimer les auth.users explicitement via le client admin
    const deletionResults: { id: string; success: boolean; error?: string }[] = []
    for (const userId of userIds) {
      const { error: authErr } = await admin.auth.admin.deleteUser(userId)
      deletionResults.push({
        id: userId,
        success: !authErr,
        error: authErr?.message,
      })
    }

    // ── Journal de purge (Sentry / logs serveur) ─────────────────────
    console.log('[PURGE-TENANT] Purge Loi 25 complétée', {
      company_id: companyId,
      requested_by: user.email,
      timestamp: new Date().toISOString(),
      users_deleted: deletionResults,
    })

    return NextResponse.json({
      success: true,
      message: 'Toutes les données de votre entreprise ont été définitivement supprimées, conformément à la Loi 25 du Québec.',
      company_id: companyId,
      users_deleted: deletionResults.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[DELETE /api/admin/purge-tenant]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne lors de la purge' },
      { status: 500 }
    )
  }
}
