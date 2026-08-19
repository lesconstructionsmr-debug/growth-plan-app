import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/account/delete
 *
 * Suppression de compte (Loi 25 du Québec - Droit à l'effacement).
 * Permet à tout utilisateur connecté de supprimer son propre compte (ou d'effacer la compagnie s'il est propriétaire).
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

    const { supabase, user } = await requireAuth()
    const admin = createAdminClient()

    // Vérifier le profil de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .maybeSingle()

    const companyId = profile?.company_id as string | undefined
    const isOwner = profile && ['propriétaire', 'owner'].includes(profile.role ?? '')

    if (isOwner && companyId) {
      // ── 1. Propriétaire : Purge complète de l'entreprise (Loi 25) ─────
      const { data: membres } = await admin
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', companyId)

      const userIds = (membres ?? []).map((m) => m.id as string)

      const tables = [
        'notes', 'depenses', 'factures', 'devis', 'leads', 'employes',
        'jobs', 'clients', 'invitations', 'subscriptions', 'reminders',
      ] as const

      for (const table of tables) {
        try {
          await admin.from(table as string).delete().eq('company_id', companyId)
        } catch {
          // ignore table if missing
        }
      }

      await admin.from('companies').delete().eq('id', companyId)

      const deletionResults = []
      for (const uid of userIds) {
        const { error: authErr } = await admin.auth.admin.deleteUser(uid)
        deletionResults.push({ id: uid, success: !authErr })
      }

      return NextResponse.json({
        success: true,
        message: 'Votre entreprise et toutes vos données ont été supprimées définitivement.',
        company_id: companyId,
        users_deleted: deletionResults.length,
      })
    } else {
      // ── 2. Membre / Collaborateur : Suppression de son compte individuel ──
      await admin.from('profiles').delete().eq('id', user.id)
      if (user.email) {
        try {
          await admin.from('invitations').delete().eq('email', user.email)
        } catch {
          // ignore if missing
        }
      }
      const { error: authErr } = await admin.auth.admin.deleteUser(user.id)

      if (authErr) {
        return NextResponse.json({ error: `Erreur suppression compte: ${authErr.message}` }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Votre compte utilisateur a été supprimé définitivement.',
      })
    }
  } catch (err) {
    return apiError(err, '[DELETE /api/account/delete]')
  }
}
