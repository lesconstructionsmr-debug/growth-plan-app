import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'
import { createClientRecord } from '@/lib/api/clients'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { vertical, compagnie, client } = await req.json()
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // 1. Récupérer ou créer le profil
    let { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()

    let companyId = profile?.company_id

    // 2. Créer la compagnie si elle n'existe pas encore
    if (!companyId) {
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name:     compagnie?.nom || 'Mon Entreprise',
          vertical: vertical || 'construction',
        })
        .select('id')
        .single()

      companyId = newCompany?.id

      // Créer ou mettre à jour le profil avec le company_id
      await supabase.from('profiles').upsert({
        id:         user.id,
        company_id: companyId,
        full_name:  user.user_metadata?.full_name || `${user.user_metadata?.prenom || ''} ${user.user_metadata?.nom || ''}`.trim() || null,
        role:       'owner',
      })
    } else {
      // Mettre à jour la compagnie existante
      const updates: Record<string, unknown> = {}
      if (compagnie?.nom)       updates.name      = compagnie.nom
      if (compagnie?.telephone) updates.telephone = compagnie.telephone
      if (compagnie?.adresse)   updates.adresse   = compagnie.adresse
      if (compagnie?.ville)     updates.ville     = compagnie.ville
      if (compagnie?.tps_no)    updates.tps_no    = compagnie.tps_no
      if (compagnie?.tvq_no)    updates.tvq_no    = compagnie.tvq_no
      if (vertical)             updates.vertical  = vertical

      if (Object.keys(updates).length > 0) {
        await supabase.from('companies').update(updates).eq('id', companyId)
      }
    }

    // 3. Créer le premier client si fourni
    if (client?.nom) {
      await createClientRecord({
        nom:       client.nom,
        email:     client.email     || undefined,
        telephone: client.telephone || undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
