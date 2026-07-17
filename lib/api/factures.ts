import { createClient } from './supabase-server'
import { requireCompany } from './auth'

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

  // Arrondi strict au centime près (évite les divergences 0,01$ entre JS et Postgres numeric(12,2))
  const round2 = (n: number) => Math.round(n * 100) / 100

  const TPS = 0.05
  const TVQ = 0.09975
  const montant_ht = round2(payload.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0))
  const tps         = payload.appliquer_tps ? round2(montant_ht * TPS) : 0
  const tvq         = payload.appliquer_tvq ? round2(montant_ht * TVQ) : 0
  const montant_ttc = round2(montant_ht + tps + tvq)

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

  if (error) throw error
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

  if (error) throw error
}
