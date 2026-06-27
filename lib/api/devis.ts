import { createClient } from './supabase-server'

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

  if (error) { console.error('[getDevis]', error); return [] }
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()

  // Numéro séquentiel sécurisé — filtre par company_id + année pour éviter les doublons
  const year = new Date().getFullYear()
  const { count: existingCount } = await supabase
    .from('devis')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', profile?.company_id)
    .like('numero', `DEV-${year}-%`)
  const seqNum = String((existingCount ?? 0) + 1).padStart(3, '0')
  const autoNumero = payload.numero || `DEV-${year}-${seqNum}`

  const TPS = 0.05
  const TVQ = 0.09975
  const montant_ht = payload.lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
  const tps = payload.appliquer_tps ? montant_ht * TPS : 0
  const tvq = payload.appliquer_tvq ? montant_ht * TVQ : 0
  const montant_ttc = montant_ht + tps + tvq

  const lignesSansId = payload.lignes.map(({ id: _id, ...l }) => l)

  const { data, error } = await supabase
    .from('devis')
    .insert({
      company_id: profile?.company_id,
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
