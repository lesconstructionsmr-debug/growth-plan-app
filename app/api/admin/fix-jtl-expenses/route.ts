import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DESCRIPTIONS_FIXES = [
  'loyer',
  'cell',
  'assurance voiture',
  'épicerie',
  'epicerie',
  'meuble financer',
  'invisalign',
  'assurance nolan',
  'paiement voiture',
  'gaz'
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Trouver le profile et company_id pour peinture.jtl@gmail.com
    const { data: userAuth } = await supabase.auth.admin.listUsers()
    const jtlUser = userAuth?.users?.find(u => u.email === 'peinture.jtl@gmail.com')

    let companyId: string | null = null

    if (jtlUser) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', jtlUser.id)
        .single()
      companyId = prof?.company_id ?? null
    }

    if (!companyId) {
      // Fallback : rechercher la compagnie par nom
      const { data: comp } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', '%jtl%')
        .limit(1)
        .maybeSingle()
      companyId = comp?.id ?? null
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Compagnie JTL introuvable' }, { status: 404 })
    }

    // 2. Mettre à jour les dépenses ciblées vers la catégorie "Dépense Fixe"
    const { data: depenses } = await supabase
      .from('depenses')
      .select('id, description, categorie')
      .eq('company_id', companyId)

    if (!depenses) {
      return NextResponse.json({ message: 'Aucune dépense trouvée' })
    }

    const updatedIds: string[] = []

    for (const d of depenses) {
      const descLower = d.description.toLowerCase().trim()
      const match = DESCRIPTIONS_FIXES.some(f => descLower.includes(f))
      if (match) {
        await supabase
          .from('depenses')
          .update({ categorie: 'Dépense Fixe' })
          .eq('id', d.id)
        updatedIds.push(d.id)
      }
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      updated_count: updatedIds.length,
      descriptions_traitees: DESCRIPTIONS_FIXES,
    })
  } catch (err) {
    console.error('[fix-jtl-expenses]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
