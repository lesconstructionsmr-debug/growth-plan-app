import { createClient } from './supabase-server'
import { requireCompany } from './auth'
import { calculerTotaux } from './fiscal'

export interface LigneFacture {
  id?: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

export async function getFactures() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(nom)')
    .order('created_at', { ascending: false })
    .limit(100) // Pagination de sécurité : jamais plus de 100 lignes

  if (error) throw new Error(`[getFactures] ${error.message}`) // Propagé, pas avaleré
  return data ?? []
}

export async function getFactureById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(*), devis(numero)')
    .eq('id', id)
    .single()

  if (error) { console.error('[getFactureById]', error); return null }
  return data
}

export async function createFacture(payload: {
  client_id: string
  devis_id?: string
  numero?: string
  titre?: string
  date_emission: string
  date_echeance: string
  mode_reglement: string
  notes?: string
  notes_internes?: string
  lignes: LigneFacture[]
  appliquer_tps: boolean
  appliquer_tvq: boolean
}) {
  const { supabase, companyId } = await requireCompany()

  // Numéro séquentiel sécurisé par company + année
  const year = new Date().getFullYear()
  const { count: existingCount } = await supabase
    .from('factures')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .like('numero', `FAC-${year}-%`)
  const seqNum = String((existingCount ?? 0) + 1).padStart(3, '0')
  const autoNumero = payload.numero || `FAC-${year}-${seqNum}`

  const { montant_ht, tps, tvq, montant_ttc } = calculerTotaux(
    payload.lignes, payload.appliquer_tps, payload.appliquer_tvq
  )

  const lignesSansId = payload.lignes.map(({ id: _id, ...l }) => l)

  const { data, error } = await supabase
    .from('factures')
    .insert({
      company_id: companyId,
      client_id: payload.client_id,
      devis_id: payload.devis_id || null,
      numero: autoNumero,
      titre: payload.titre,
      date_emission: payload.date_emission,
      date_echeance: payload.date_echeance,
      mode_reglement: payload.mode_reglement,
      notes: payload.notes,
      notes_internes: payload.notes_internes,
      lignes: lignesSansId,
      montant_ht,
      tps,
      tvq,
      montant_ttc,
      statut: 'brouillon',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateFactureStatut(id: string, statut: string, datePaiement?: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('factures')
    .update({
      statut,
      date_paiement: datePaiement ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
