import { createClient } from './supabase-server'
import { normalizeStatut, DEVIS_EN_ATTENTE, FACTURES_IMPAYEES } from '@/lib/status'

export async function getDashboardKPIs() {
  const supabase = createClient()

  const [
    { count: totalClients },
    { data: devisData },
    { data: facturesData },
    { count: jobsActifs },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('devis').select('statut, montant_ttc'),
    supabase.from('factures').select('statut, montant_ttc, date_echeance'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
  ])

  const devisNorm = (devisData ?? []).map(d => ({
    ...d,
    statut: normalizeStatut(d.statut, 'brouillon'),
  }))
  const facturesNorm = (facturesData ?? []).map(f => ({
    ...f,
    statut: normalizeStatut(f.statut, 'brouillon'),
  }))

  const devisEnAttente = devisNorm.filter(d => DEVIS_EN_ATTENTE.includes(d.statut as typeof DEVIS_EN_ATTENTE[number])).length
  const devisMontant = devisNorm
    .filter(d => DEVIS_EN_ATTENTE.includes(d.statut as typeof DEVIS_EN_ATTENTE[number]))
    .reduce((s, d) => s + (d.montant_ttc ?? 0), 0)

  const today = new Date().toISOString().split('T')[0]
  const facturesEnRetard = facturesNorm.filter(f =>
    (f.statut === 'envoyee' || f.statut === 'en_retard') && f.date_echeance && f.date_echeance < today
  ).length

  const revenusRecents = facturesNorm
    .filter(f => f.statut === 'payee')
    .reduce((s, f) => s + (f.montant_ttc ?? 0), 0)

  return {
    totalClients:      totalClients ?? 0,
    jobsActifs:        jobsActifs ?? 0,
    devisEnAttente,
    devisMontant,
    facturesEnRetard,
    revenusRecents,
  }
}

export async function getActiviteRecente() {
  const supabase = createClient()

  const [{ data: devis }, { data: factures }, { data: clients }] = await Promise.all([
    supabase.from('devis').select('id, numero, statut, created_at, clients(nom)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('factures').select('id, numero, statut, montant_ttc, created_at, clients(nom)')
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('clients').select('id, nom, created_at')
      .order('created_at', { ascending: false }).limit(5),
  ])

  return { devis: devis ?? [], factures: factures ?? [], clients: clients ?? [] }
}
