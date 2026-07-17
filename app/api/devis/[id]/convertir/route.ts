import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// POST /api/devis/[id]/convertir — Convertit un devis approuvé en facture
// Protection anti-double-clic : la mise à jour du statut est atomique via
// un UPDATE conditionnel qui n'affecte 0 lignes si déjà converti.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()

    // ── ÉTAPE 1 : Verrouillage atomique ──────────────────────────────
    // On met à jour le statut en "converti" SEULEMENT si le devis est
    // encore dans un état convertible (approuve). Cette opération est
    // atomique côté Postgres : si deux requêtes arrivent en même temps,
    // une seule réussira à changer le statut, l'autre récupérera 0 lignes.
    const { data: locked, error: lockErr } = await supabase
      .from('devis')
      .update({ statut: 'converti', updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .in('statut', ['approuve', 'envoye', 'vu']) // États convertibles
      .select('*')
      .maybeSingle()

    if (lockErr) throw lockErr

    // Si aucune ligne retournée : soit le devis n'existe pas,
    // soit il était déjà converti (double-clic intercepté).
    if (!locked) {
      // Vérifier si c'est un 404 ou un 409 (déjà converti)
      const { data: existing } = await supabase
        .from('devis')
        .select('statut')
        .eq('id', params.id)
        .eq('company_id', companyId)
        .maybeSingle()

      if (!existing) {
        return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
      }
      // Le devis existe mais ne répond plus au filtre => déjà converti
      return NextResponse.json(
        { error: 'Ce devis a déjà été converti en facture.' },
        { status: 409 }
      )
    }

    // ── ÉTAPE 2 : Générer le numéro de facture ────────────────────────
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('factures')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
    const seqNum = String((count ?? 0) + 1).padStart(3, '0')
    const numero = `FAC-${year}-${seqNum}`

    // ── ÉTAPE 3 : Créer la facture ────────────────────────────────────
    const { data: facture, error: facErr } = await supabase
      .from('factures')
      .insert({
        company_id:    companyId,
        client_id:     locked.client_id,
        devis_id:      locked.id,
        numero,
        titre:         locked.titre,
        statut:        'brouillon',
        lignes:        locked.lignes,
        montant_ht:    locked.montant_ht,
        tps:           locked.tps,
        tvq:           locked.tvq,
        montant_ttc:   locked.montant_ttc,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes:         locked.notes,
      })
      .select()
      .single()

    if (facErr) {
      // Rollback du statut si l'insertion de la facture échoue
      await supabase
        .from('devis')
        .update({ statut: 'approuve', updated_at: new Date().toISOString() })
        .eq('id', params.id)
      throw facErr
    }

    return NextResponse.json({ facture_id: facture.id, numero }, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/devis/convertir]')
  }
}
