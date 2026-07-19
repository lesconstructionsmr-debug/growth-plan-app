import { createClient } from './supabase-server'
import { requireCompany } from './auth'
import { calculerTotaux } from './fiscal'

export interface LigneDevis {
  id?: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
}

export async function getDevis() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(nom)')
    .order('created_at', { ascending: false })
    .limit(100) // Pagination de sécurité : jamais plus de 100 lignes

  if (error) throw new Error(`[getDevis] ${error.message}`) // Propagé, pas avaleré
  return data ?? []
}

export async function getDevisById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(*), jobs(titre)')
    .eq('id', id)
    .single()

  if (error) { console.error('[getDevisById]', error); return null }
  return data
}

export async function getDevisByToken(token: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(*)')
    .eq('portal_token', token)
    .single()

  if (error) { console.error('[getDevisByToken]', error); return null }
  return data
}

export async function createDevis(payload: {
  client_id: string
  titre: string
  numero?: string
  date_emission: string
  valide_jusqu_au: string
  reference_projet?: string
  notes?: string
  notes_internes?: string
  lignes: LigneDevis[]
  appliquer_tps: boolean
  appliquer_tvq: boolean
  statut?: string
}) {
  const { supabase, companyId } = await requireCompany()

  // Numéro séquentiel sécurisé — filtre par company_id + année pour éviter les doublons
  const year = new Date().getFullYear()
  const { count: existingCount } = await supabase
    .from('devis')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .like('numero', `DEV-${year}-%`)
  const seqNum = String((existingCount ?? 0) + 1).padStart(3, '0')
  const autoNumero = payload.numero || `DEV-${year}-${seqNum}`

  const { montant_ht, tps, tvq, montant_ttc } = calculerTotaux(
    payload.lignes, payload.appliquer_tps, payload.appliquer_tvq
  )

  const lignesSansId = payload.lignes.map(({ id: _id, ...l }) => l)

  const { data, error } = await supabase
    .from('devis')
    .insert({
      company_id: companyId,
      client_id: payload.client_id,
      numero: autoNumero,
      titre: payload.titre,
      date_emission: payload.date_emission,
      valide_jusqu_au: payload.valide_jusqu_au,
      reference_projet: payload.reference_projet,
      notes: payload.notes,
      notes_internes: payload.notes_internes,
      lignes: lignesSansId,
      montant_ht,
      tps,
      tvq,
      montant_ttc,
      statut: payload.statut ?? 'brouillon',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDevisStatut(id: string, statut: string) {
  const supabase = createClient()
  const updates: Record<string, unknown> = {
    statut,
    updated_at: new Date().toISOString(),
  }
  if (statut === 'envoyé') updates.envoye_le = new Date().toISOString()
  if (statut === 'approuvé') updates.approuve_le = new Date().toISOString()

  const { error } = await supabase
    .from('devis')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}
