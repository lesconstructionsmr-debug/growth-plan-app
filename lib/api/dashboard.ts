import { createClient } from './supabase-server'

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

  const devisEnAttente  = devisData?.filter(d => d.statut === 'envoyé').length ?? 0
  const devisMontant    = devisData?.filter(d => d.statut === 'envoyé')
    .reduce((s, d) => s + (d.montant_ttc ?? 0), 0) ?? 0

  const today = new Date().toISOString().split('T')[0]
  const facturesEnRetard = facturesData?.filter(f =>
    f.statut === 'envoyée' && f.date_echeance && f.date_echeance < today
  ).length ?? 0

  const revenusRecents = facturesData?.filter(f => f.statut === 'payée')
    .reduce((s, f) => s + (f.montant_ttc ?? 0), 0) ?? 0

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
