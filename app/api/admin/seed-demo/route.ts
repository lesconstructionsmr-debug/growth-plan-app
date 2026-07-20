import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// Liste de noms québécois réalistes pour peupler la démo (35 clients)
const CLIENTS_BANQUE = [
  { nom: 'Pierre Tremblay', email: 'p.tremblay.demo@gmail.com', tel: '514-555-1001', adresse: '450 rue Saint-Denis', ville: 'Montréal' },
  { nom: 'Marie Gagnon', email: 'm.gagnon.demo@gmail.com', tel: '438-555-1002', adresse: '1240 av. du Mont-Royal', ville: 'Montréal' },
  { nom: 'Jean Roy', email: 'j.roy.demo@gmail.com', tel: '450-555-1003', adresse: '88 ch. du Fleuve', ville: 'Brossard' },
  { nom: 'Sophie Côté', email: 's.cote.demo@gmail.com', tel: '514-555-1004', adresse: '3200 rue Sherbrooke Est', ville: 'Montréal' },
  { nom: 'Michel Bouchard', email: 'm.bouchard.demo@gmail.com', tel: '450-555-1005', adresse: '15 boul. des Laurentides', ville: 'Laval' },
  { nom: 'Julie Gauthier', email: 'j.gauthier.demo@gmail.com', tel: '514-555-1006', adresse: '95 av. Laurier', ville: 'Montréal' },
  { nom: 'François Morin', email: 'f.morin.demo@gmail.com', tel: '438-555-1007', adresse: '1840 rue de Verdun', ville: 'Montréal' },
  { nom: 'Isabelle Lavoie', email: 'i.lavoie.demo@gmail.com', tel: '450-555-1008', adresse: '730 rue Saint-Jean', ville: 'Longueuil' },
  { nom: 'Martin Fortin', email: 'm.fortin.demo@gmail.com', tel: '514-555-1009', adresse: '254 rue Rachel', ville: 'Montréal' },
  { nom: 'Chantal Pelletier', email: 'c.pelletier.demo@gmail.com', tel: '450-555-1010', adresse: '512 av. Bourgogne', ville: 'Chambly' },
  { nom: 'Luc Bélanger', email: 'l.belanger.demo@gmail.com', tel: '514-555-1011', adresse: '3800 boul. Taschereau', ville: 'Brossard' },
  { nom: 'Annie Lévesque', email: 'a.levesque.demo@gmail.com', tel: '438-555-1012', adresse: '142 rue de l\'Église', ville: 'Montréal' },
  { nom: 'Guy Bergeron', email: 'g.bergeron.demo@gmail.com', tel: '450-555-1013', adresse: '960 boul. Curé-Labelle', ville: 'Laval' },
  { nom: 'Hélène Simard', email: 'h.simard.demo@gmail.com', tel: '514-555-1014', adresse: '57 av. des Pins', ville: 'Montréal' },
  { nom: 'Robert Girard', email: 'r.girard.demo@gmail.com', tel: '450-555-1015', adresse: '112 ch. des Ancêtres', ville: 'Mont-Tremblant' },
  { nom: 'Louise Ouellet', email: 'l.ouellet.demo@gmail.com', tel: '514-555-1016', adresse: '8400 De Lorimier', ville: 'Montréal' },
  { nom: 'Sylvain Marcoux', email: 's.marcoux.demo@gmail.com', tel: '438-555-1017', adresse: '302 rue de Margaux', ville: 'Mascouche' },
  { nom: 'Diane Gaudreault', email: 'd.gaudreault.demo@gmail.com', tel: '450-555-1018', adresse: '54 rue Gaudreault', ville: 'Repentigny' },
  { nom: 'Stéphane Harvey', email: 's.harvey.demo@gmail.com', tel: '514-555-1019', adresse: '12220 53e avenue', ville: 'Montréal' },
  { nom: 'Nicole Gendreau', email: 'n.gendreau.demo@gmail.com', tel: '450-555-1020', adresse: '132 rue Alizé', ville: 'Saint-Colomban' },
  { nom: 'Daniel Paquet', email: 'd.paquet.demo@gmail.com', tel: '514-555-1021', adresse: '45 rue Grignon', ville: 'Saint-Eustache' },
  { nom: 'Manon Dufour', email: 'm.dufour.demo@gmail.com', tel: '438-555-1022', adresse: '10402 De Lorimier', ville: 'Montréal' },
  { nom: 'Gilles Lemieux', email: 'g.lemieux.demo@gmail.com', tel: '450-555-1023', adresse: '2584 rue Pluvier', ville: 'Laval' },
  { nom: 'Line Lachance', email: 'l.lachance.demo@gmail.com', tel: '514-555-1024', adresse: '1477 rue McDonald', ville: 'Montréal' },
  { nom: 'Jacques Nadeau', email: 'j.nadeau.demo@gmail.com', tel: '450-555-1025', adresse: '135 ch. de la Sablonnière', ville: 'Sainte-Thérèse' },
  { nom: 'Sylvie Rousseau', email: 's.rousseau.demo@gmail.com', tel: '514-555-1026', adresse: '8942 Lajeunesse', ville: 'Montréal' },
  { nom: 'Marc Fillion', email: 'm.fillion.demo@gmail.com', tel: '450-555-1027', adresse: '3447 ch. Lotbinière', ville: 'Saint-Lazare' },
  { nom: 'Guylaine Lapointe', email: 'g.lapointe.demo@gmail.com', tel: '514-555-1028', adresse: '47 Deslauriers', ville: 'Pierrefonds' },
  { nom: 'Alain Poulin', email: 'a.poulin.demo@gmail.com', tel: '450-555-1029', adresse: '10305 boul. Laurier', ville: 'Terrebonne' },
  { nom: 'Nathalie Simard', email: 'n.simard.demo@gmail.com', tel: '514-555-1030', adresse: '470 rue Bourque', ville: 'Repentigny' },
  { nom: 'Christian Gravel', email: 'c.gravel.demo@gmail.com', tel: '450-555-1031', adresse: '190 rue Saraguay Est', ville: 'Roxboro' },
  { nom: 'Johanne Lafontaine', email: 'j.lafontaine.demo@gmail.com', tel: '514-555-1032', adresse: '139 Pierre-Fournier', ville: 'Lachenaie' },
  { nom: 'Denis Boucher', email: 'd.boucher.demo@gmail.com', tel: '450-555-1033', adresse: '1257 de Cardiff', ville: 'Laval' },
  { nom: 'Linda Caron', email: 'l.caron.demo@gmail.com', tel: '514-555-1034', adresse: '18897 Hubert-Aquin', ville: 'Mirabel' },
  { nom: 'Serge Cloutier', email: 's.cloutier.demo@gmail.com', tel: '438-555-1035', adresse: '11 rue d\'Argenson', ville: 'Blainville' }
]

const LIGNES_DEVIS_PEINTRE = [
  { description: "Préparation des surfaces (sablage, plâtrage, apprêt)", quantite: 1, unite: "forfait", prix_unitaire: 1200 },
  { description: "Peinture murs — latex acrylique Benjamin Moore (2 couches)", quantite: 1, unite: "forfait", prix_unitaire: 1950 },
  { description: "Peinture plafonds — blanc plat", quantite: 1, unite: "forfait", prix_unitaire: 850 },
  { description: "Peinture boiseries, plinthes et cadrages", quantite: 1, unite: "forfait", prix_unitaire: 600 }
]

// ── POST : PEUPLER OU RÉ-INITIALISER LA DÉMO ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { supabase, user, companyId } = await requireCompany()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthorized = 
      profile?.role === 'propriétaire' || 
      profile?.role === 'administrateur' ||
      user.email === 'peinture.jtl@gmail.com' ||
      user.email === 'max@growth-plan.ca'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // 1. NETTOYAGE PRÉALABLE DES DONNÉES DÉMO
    await supabase.from('factures').delete().eq('company_id', companyId).like('numero', 'FAC-DEMO-%')
    await supabase.from('devis').delete().eq('company_id', companyId).like('numero', 'DEV-DEMO-%')
    await supabase.from('jobs').delete().eq('company_id', companyId).like('titre', '[DÉMO]%')
    await supabase.from('leads').delete().eq('company_id', companyId).like('email', '%.demo@%')
    await supabase.from('clients').delete().eq('company_id', companyId).like('email', '%.demo@%')

    // 2. PEUPLEMENT DES 35 CLIENTS
    const clientsPayload = CLIENTS_BANQUE.map(c => ({
      company_id: companyId,
      nom: c.nom,
      email: c.email,
      telephone: c.tel,
      adresse: c.adresse,
      ville: c.ville,
      province: 'QC',
      notes: 'Généré par la prévisualisation démo instantanée.'
    }))

    const { data: clients, error: clientsErr } = await supabase
      .from('clients')
      .insert(clientsPayload)
      .select('id, nom')

    if (clientsErr || !clients) throw clientsErr ?? new Error('Peuplement des clients échoué')

    // 3. CRÉATION DES CHANTIERS (JOBS)
    const jobStatuses = ['planifie', 'en_cours', 'termine', 'en_cours', 'planifie']
    const jobsPayload = Array.from({ length: 5 }).map((_, i) => {
      const client = clients[i % clients.length]
      return {
        company_id: companyId,
        client_id: client.id,
        titre: `[DÉMO] Projet Peinture — ${client.nom}`,
        description: 'Chantier modèle comprenant la préparation complète et l\'application de peinture commerciale/résidentielle.',
        statut: jobStatuses[i],
        date_debut: new Date(Date.now() - (15 - i) * 24 * 3600 * 1000).toISOString().split('T')[0],
        date_fin: new Date(Date.now() + (15 + i) * 24 * 3600 * 1000).toISOString().split('T')[0],
        budget: 5000 + i * 3500,
        adresse: 'Adresse modèle Québec'
      }
    })

    const { data: jobs, error: jobsErr } = await supabase
      .from('jobs')
      .insert(jobsPayload)
      .select('id')

    if (jobsErr || !jobs) throw jobsErr

    // 4. PEUPLEMENT DE 20 DEVIS
    const devisStatuses = [
      'brouillon', 'envoye', 'vu', 'approuve', 'refuse', 'converti', 
      'envoye', 'vu', 'approuve', 'converti', 'brouillon', 'envoye',
      'vu', 'approuve', 'converti', 'brouillon', 'envoye', 'vu', 'approuve', 'converti'
    ]
    const devisPayload = Array.from({ length: 20 }).map((_, i) => {
      const client = clients[i % clients.length]
      const job = jobs[i % jobs.length]
      const dateOffset = 25 - i

      const ht = 3500 + i * 450
      const tps = Math.round(ht * 0.05 * 100) / 100
      const tvq = Math.round(ht * 0.09975 * 100) / 100
      const ttc = ht + tps + tvq

      return {
        company_id: companyId,
        client_id: client.id,
        job_id: job.id,
        numero: `DEV-DEMO-${String(i + 1).padStart(3, '0')}`,
        titre: `Soumission Peinture ${client.nom}`,
        statut: devisStatuses[i],
        lignes: LIGNES_DEVIS_PEINTRE,
        montant_ht: ht,
        tps,
        tvq,
        montant_ttc: ttc,
        notes: 'Benjamin Moore série ultra-spécifique. Travaux garantis 2 ans.',
        date_emission: new Date(Date.now() - dateOffset * 24 * 3600 * 1000).toISOString().split('T')[0],
        valide_jusqu_au: new Date(Date.now() + (30 - dateOffset) * 24 * 3600 * 1000).toISOString().split('T')[0]
      }
    })

    const { data: devis, error: devisErr } = await supabase
      .from('devis')
      .insert(devisPayload)
      .select('id, statut, client_id, montant_ht, tps, tvq, montant_ttc')

    if (devisErr || !devis) throw devisErr

    // 5. PEUPLEMENT DE 15 FACTURES
    const facturesPayload = Array.from({ length: 15 }).map((_, i) => {
      const assocDevis = devis[i % devis.length]
      const dateOffset = 20 - i
      
      const stats = ['brouillon', 'envoyee', 'payee', 'en_retard', 'payee']
      const statVal = stats[i % stats.length]

      return {
        company_id: companyId,
        client_id: assocDevis.client_id,
        devis_id: assocDevis.id,
        numero: `FAC-DEMO-${String(i + 1).padStart(3, '0')}`,
        titre: `Facture Peinture Modèle ${i + 1}`,
        statut: statVal,
        lignes: LIGNES_DEVIS_PEINTRE,
        montant_ht: assocDevis.montant_ht,
        tps: assocDevis.tps,
        tvq: assocDevis.tvq,
        montant_ttc: assocDevis.montant_ttc,
        date_emission: new Date(Date.now() - dateOffset * 24 * 3600 * 1000).toISOString().split('T')[0],
        date_echeance: new Date(Date.now() + (30 - dateOffset) * 24 * 3600 * 1000).toISOString().split('T')[0],
        date_paiement: statVal === 'payee' ? new Date(Date.now() - (dateOffset - 5) * 24 * 3600 * 1000).toISOString().split('T')[0] : null
      }
    })

    const { error: facErr } = await supabase
      .from('factures')
      .insert(facturesPayload)

    if (facErr) throw facErr

    // 6. PEUPLEMENT DE 10 LEADS (PIPELINE / CRM)
    const leadSources = ['référence', 'site_web', 'google', 'référence', 'publicité']
    const leadStatuses = ['nouveau', 'contacté', 'qualifié', 'proposition', 'nouveau']
    const leadsPayload = Array.from({ length: 10 }).map((_, i) => {
      const clientName = `Lead Démo ${i + 1}`
      return {
        company_id: companyId,
        nom: clientName,
        email: `lead.${i + 1}.demo@gmail.com`,
        telephone: `514-555-90${String(i).padStart(2, '0')}`,
        source: leadSources[i % leadSources.length],
        statut: leadStatuses[i % leadStatuses.length],
        valeur_estimee: 2500 + i * 1200,
        notes: 'Intérêt pour travaux de peinture latex intérieure rapide.'
      }
    })

    const { error: leadsErr } = await supabase
      .from('leads')
      .insert(leadsPayload)

    if (leadsErr) throw leadsErr

    return NextResponse.json({ success: true, message: 'Données démo générées avec succès !' })
  } catch (err) {
    console.error('[POST /api/admin/seed-demo]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne de seeding' },
      { status: 500 }
    )
  }
}

// ── DELETE : REVERSE / PURGER TOUTES LES DONNÉES DÉMO ──────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user, companyId } = await requireCompany()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAuthorized = 
      profile?.role === 'propriétaire' || 
      profile?.role === 'administrateur' ||
      user.email === 'peinture.jtl@gmail.com' ||
      user.email === 'max@growth-plan.ca'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Supprimer uniquement les enregistrements identifiés comme démo
    await supabase.from('factures').delete().eq('company_id', companyId).like('numero', 'FAC-DEMO-%')
    await supabase.from('devis').delete().eq('company_id', companyId).like('numero', 'DEV-DEMO-%')
    await supabase.from('jobs').delete().eq('company_id', companyId).like('titre', '[DÉMO]%')
    await supabase.from('leads').delete().eq('company_id', companyId).like('email', '%.demo@%')
    await supabase.from('clients').delete().eq('company_id', companyId).like('email', '%.demo@%')

    return NextResponse.json({ success: true, message: 'Toutes les données et faux clients démo ont été supprimés avec succès !' })
  } catch (err) {
    console.error('[DELETE /api/admin/seed-demo]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la suppression des données démo' },
      { status: 500 }
    )
  }
}
