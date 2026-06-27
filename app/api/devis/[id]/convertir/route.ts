import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/devis/[id]/convertir — Convertit un devis approuvé en facture
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })

    // Charger le devis
    const { data: devis, error: devisErr } = await supabase
      .from('devis')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (devisErr || !devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    if (devis.statut === 'converti') return NextResponse.json({ error: 'Déjà converti' }, { status: 409 })

    // Générer le numéro de facture
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('factures')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
    const seqNum = String((count ?? 0) + 1).padStart(3, '0')
    const numero = `FAC-${year}-${seqNum}`

    // Créer la facture
    const { data: facture, error: facErr } = await supabase
      .from('factures')
      .insert({
        company_id:    profile.company_id,
        client_id:     devis.client_id,
        devis_id:      devis.id,
        numero,
        titre:         devis.titre,
        statut:        'brouillon',
        lignes:        devis.lignes,
        montant_ht:    devis.montant_ht,
        tps:           devis.tps,
        tvq:           devis.tvq,
        montant_ttc:   devis.montant_ttc,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes:         devis.notes,
      })
      .select()
      .single()

    if (facErr) throw facErr

    // Marquer le devis comme converti
    await supabase
      .from('devis')
      .update({ statut: 'converti', updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ facture_id: facture.id, numero }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
