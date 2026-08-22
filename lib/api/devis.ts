import { createClient } from './supabase-server'
import { requireCompany } from './auth'
import { calculerTotaux } from './fiscal'
import { generateNextDocumentNumber } from './sequence'

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

import { createAnonClient } from '@/lib/supabase/anon'

export async function getDevisByToken(token: string) {
  const supabase = createAnonClient()
  const { data, error } = await supabase.rpc('portal_get_devis', { p_token: token })

  if (error) { console.error('[getDevisByToken]', error); return null }
  return data
}

export async function createDevis(payload: {
  client_id: string
  job_id?: string
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

  const autoNumero = await generateNextDocumentNumber(supabase, companyId, 'devis', payload.numero)

  const { montant_ht, tps, tvq, montant_ttc } = calculerTotaux(
    payload.lignes, payload.appliquer_tps, payload.appliquer_tvq
  )

  const lignesSansId = payload.lignes.map(({ id: _id, ...l }) => l)

  const { data, error } = await supabase
    .from('devis')
    .insert({
      company_id: companyId,
      client_id: payload.client_id,
      job_id: payload.job_id ?? null,
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

  // PostgrestError n'est pas une instance d'Error : on convertit pour que le
  // message réel (colonne manquante, contrainte, RLS) remonte jusqu'au client.
  if (error) throw new Error(`[createDevis] ${error.message}${error.details ? ` — ${error.details}` : ''}`)
  return data
}

export async function updateDevisStatut(id: string, statut: string) {
  const supabase = createClient()
  const updates: Record<string, unknown> = {
    statut,
    updated_at: new Date().toISOString(),
  }
  if (statut === 'envoye') updates.envoye_le = new Date().toISOString()
  if (statut === 'approuve') updates.approuve_le = new Date().toISOString()

  const { error } = await supabase
    .from('devis')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}
