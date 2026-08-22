import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/account/purge
 *
 * Loi 25 Québec — Droit à l'oubli (droit à l'effacement).
 * Supprime définitivement et irréversiblement les données de l'entreprise ou le compte de l'utilisateur :
 * - Toutes les tables métier de l'entreprise
 * - L'enregistrement de la compagnie
 * - Les comptes auth.users associés
 *
 * SÉCURITÉ :
 * - Requiert une session authentifiée valide
 * - Requiert un header explicite : X-Confirm-Purge: DELETE-MY-ACCOUNT
 * - Propriétaire uniquement pour la purge d'entreprise complète
 */
export async function DELETE(req: NextRequest) {
  try {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const roleProprio = ['propriétaire', 'owner']
    const isOwner = profile && roleProprio.includes(profile.role ?? '')

    if (!isOwner) {
      // Membres non-propriétaires : supprimer uniquement leur propre profil et compte auth
      await admin.from('profiles').delete().eq('id', user.id)
      await admin.from('invitations').delete().eq('email', user.email)
      const { error: authErr } = await admin.auth.admin.deleteUser(user.id)

      if (authErr) {
        return NextResponse.json({ error: `Erreur suppression compte: ${authErr.message}` }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Votre compte utilisateur a été définitivement supprimé.',
        users_deleted: 1,
      })
    }

    // Collecte des utilisateurs avant suppression
    const { data: membres } = await admin
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', companyId)

    const userIds = (membres ?? []).map((m) => m.id as string)

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
      'company_counters',
    ] as const

    for (const table of tables) {
      const { error } = await admin
        .from(table as string)
        .delete()
        .eq('company_id', companyId)

      if (error) {
        console.warn(`[purge-account] Skip ${table}:`, error.message)
      }
    }

    await admin.from('companies').delete().eq('id', companyId)

    const deletionResults: { id: string; success: boolean; error?: string }[] = []
    for (const userId of userIds) {
      const { error: authErr } = await admin.auth.admin.deleteUser(userId)
      deletionResults.push({
        id: userId,
        success: !authErr,
        error: authErr?.message,
      })
    }

    console.log('[PURGE-ACCOUNT] Purge Loi 25 complétée', {
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
    console.error('[DELETE /api/account/purge]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne lors de la purge' },
      { status: 500 }
    )
  }
}
