import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/delete-user?email=natasha.heon@gmail.com
 * Réservé aux administrateurs de la plateforme.
 * Supprime définitivement un compte utilisateur (auth.users + profiles + invitations) par courriel.
 */
export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const emailParam = new URL(req.url).searchParams.get('email')?.trim().toLowerCase()
    
    if (!emailParam) {
      return NextResponse.json({ error: 'Adresse email requise (?email=user@domain.com)' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Chercher dans profiles
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, company_id')
      .eq('id', emailParam) // au cas où id = email

    // Chercher aussi via auth.users
    const { data: usersData, error: listErr } = await admin.auth.admin.listUsers()
    
    let targetUserId: string | null = null
    if (!listErr && usersData?.users) {
      const foundUser = usersData.users.find(u => u.email?.toLowerCase() === emailParam)
      if (foundUser) {
        targetUserId = foundUser.id
      }
    }

    // 2. Nettoyer les invitations liées à cet email
    await admin.from('invitations').delete().eq('email', emailParam)

    if (targetUserId) {
      // Supprimer le profil et l'utilisateur Auth
      await admin.from('profiles').delete().eq('id', targetUserId)
      const { error: deleteAuthErr } = await admin.auth.admin.deleteUser(targetUserId)

      if (deleteAuthErr) {
        return NextResponse.json({ error: `Erreur lors de la suppression Auth: ${deleteAuthErr.message}` }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Compte ${emailParam} (ID: ${targetUserId}) supprimé définitivement.`,
        deleted_user_id: targetUserId,
      })
    }

    // Fallback : si l'ID n'a pas été trouvé dans auth.users mais présent dans profiles
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await admin.from('profiles').delete().eq('id', p.id)
        await admin.auth.admin.deleteUser(p.id).catch(() => {})
      }
      return NextResponse.json({
        success: true,
        message: `Profils associés à ${emailParam} nettoyés avec succès.`,
      })
    }

    return NextResponse.json({
      error: `Aucun compte utilisateur trouvé pour ${emailParam}.`,
    }, { status: 404 })

  } catch (err) {
    return apiError(err, '[DELETE /api/admin/delete-user]')
  }
}
