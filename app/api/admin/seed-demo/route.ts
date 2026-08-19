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
    await Promise.all([
      supabase.from('factures').delete().eq('company_id', companyId).like('numero', 'FAC-DEMO-%'),
      supabase.from('devis').delete().eq('company_id', companyId).like('numero', 'DEV-DEMO-%'),
      supabase.from('jobs').delete().eq('company_id', companyId).like('titre', '[DÉMO]%'),
      supabase.from('leads').delete().eq('company_id', companyId).like('email', '%.demo@%'),
      supabase.from('clients').delete().eq('company_id', companyId).like('email', '%.demo@%'),
    ])

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

    // 6. PEUPLEMENT DE 10 PROSPECTS QUALIFIÉS RBQ / SEAO (PIPELINE / CRM)
    const PROSPECTS_RBQ_SEAO = [
      {
        nom: 'Pierre Bolduc',
        entreprise: 'Construction Bolduc inc.',
        email: 'p.bolduc@constructionbolduc.ca',
        telephone: '418-543-9910',
        source: 'Prospection RBQ (Saguenay)',
        statut: 'nouveau',
        valeur_estimee: 18500,
        score: 85,
        notes: 'Licence RBQ 5612-8901-01. Rénovation commerciale & Multi-logements. Accroche : Retenues de garantie 10% & conformité CCQ.'
      },
      {
        nom: 'Marc-André Gagnon',
        entreprise: 'Réno Experts Saguenay',
        email: 'magagnon@renoexpertssaguenay.ca',
        telephone: '418-690-2214',
        source: 'Prospection RBQ (Chicoutimi)',
        statut: 'contacté',
        valeur_estimee: 12000,
        score: 80,
        notes: 'Licence RBQ 5723-1142-04. Résidentiel lourd & Agrandissements. Accroche : Estimation rapide de devis avec signature sur tablette.'
      },
      {
        nom: 'Michel Roy',
        entreprise: 'Constructions Métropolitaines M.R.',
        email: 'mroy@constructionsmetropolitaines.ca',
        telephone: '514-374-8800',
        source: 'Prospection RBQ (Montréal)',
        statut: 'qualifié',
        valeur_estimee: 35000,
        score: 90,
        notes: 'Licence RBQ 5801-4432-09. Rénovation commerciale & Institutionnel. Accroche : Inbox dépenses OCR (scan automatique factures d\'achat).'
      },
      {
        nom: 'Stéphane Fortin',
        entreprise: 'Groupe BTP Sommet inc.',
        email: 'sfortin@btpsommet.ca',
        telephone: '514-521-4450',
        source: 'Prospection RBQ (Hochelaga)',
        statut: 'nouveau',
        valeur_estimee: 24000,
        score: 75,
        notes: 'Licence RBQ 5789-9921-12. Multi-logements (CONDO / PLEX). Accroche : Indicateurs de prix des matériaux (Banque du Canada / SCHL).'
      },
      {
        nom: 'Jean-François Harvey',
        entreprise: 'Béton & Structure Nord-Lac',
        email: 'jfharvey@nordlac-beton.ca',
        telephone: '418-547-1122',
        source: 'Prospection RBQ (Jonquière)',
        statut: 'contacté',
        valeur_estimee: 28000,
        score: 85,
        notes: 'Licence RBQ 5634-7712-08. Génie civil & Fondations. Accroche : Pointage géolocalisé des heures des ouvriers sur le terrain.'
      },
      {
        nom: 'Alexandre Côté',
        entreprise: 'Habitations Rive-Sud & Île',
        email: 'acote@habitationsrivesud.ca',
        telephone: '450-672-9900',
        source: 'Prospection RBQ (Rive-Sud)',
        statut: 'qualifié',
        valeur_estimee: 22000,
        score: 88,
        notes: 'Licence RBQ 5812-3390-03. Construction neuve résidentielle. Accroche : Portail client interactif avec approbation de devis.'
      },
      {
        nom: 'Mathieu Tremblay',
        entreprise: 'Peinture & Revêtement Pro-Mat',
        email: 'mtremblay@promat-peinture.ca',
        telephone: '418-668-3311',
        source: 'Prospection RBQ (Alma)',
        statut: 'nouveau',
        valeur_estimee: 15000,
        score: 70,
        notes: 'Licence RBQ 5690-2211-05. Commercial & Industriel léger. Accroche : Calcul automatique des marges et taxes Québec (TPS/TVQ).'
      },
      {
        nom: 'David Lavoie',
        entreprise: 'Génie-Bâtiment MTL Express',
        email: 'dlavoie@geniebatimentmtl.ca',
        telephone: '514-844-5500',
        source: 'Prospection RBQ (Ville-Marie)',
        statut: 'proposition',
        valeur_estimee: 42000,
        score: 92,
        notes: 'Licence RBQ 5744-8831-07. Aménagement de bureaux & Boutiques. Accroche : Exportation JSON Loi 25 et sécurité des données.'
      },
      {
        nom: 'Éric Simard',
        entreprise: 'Toitures & Isolation Saguenay',
        email: 'esimard@toituressaguenay.ca',
        telephone: '418-549-7700',
        source: 'Prospection RBQ (Chicoutimi)',
        statut: 'contacté',
        valeur_estimee: 16500,
        score: 78,
        notes: 'Licence RBQ 5601-9943-02. Toitures commerciales & Résidentielles. Accroche : Relance automatique des factures en retard par courriel.'
      },
      {
        nom: 'Sylvain Bergeron',
        entreprise: 'Les Envois & Aménagements Urbains',
        email: 'sbergeron@amenagurbains.ca',
        telephone: '514-637-2200',
        source: 'Adjudication SEAO (Montréal)',
        statut: 'qualifié',
        valeur_estimee: 50000,
        score: 95,
        notes: 'Adjudicataire récent SEAO. Aménagement municipal & Génie civil. Accroche : Conformité aux appels d\'offres SEAO et retenues de contrat.'
      },
      // ── 10 PROSPECTS SPÉCIALISÉS PEINTURE ─────────────────────────
      {
        nom: 'Jean-Thomas Levesque',
        entreprise: 'Peinture JTL inc.',
        email: 'peinture.jtl@gmail.com',
        telephone: '514-555-4001',
        source: 'Prospection RBQ Peinture (Laval)',
        statut: 'nouveau',
        valeur_estimee: 14500,
        score: 88,
        notes: 'Licence RBQ 5689-1020-01. Peinture 9.0. Accroche : Calculateur devis m² / couches & déduction gallons (Benjamin Moore / Sherwin-Williams).'
      },
      {
        nom: 'Frédéric Beaulieu',
        entreprise: 'Les Grands Peintres du Québec',
        email: 'fbeaulieu@grandspeintres.ca',
        telephone: '418-651-7722',
        source: 'Prospection RBQ Peinture (Québec)',
        statut: 'qualifié',
        valeur_estimee: 32000,
        score: 92,
        notes: 'Licence RBQ 5712-4409-03. Peinture commerciale & institutionnelle. Accroche : Scan OCR factures d\'achat peinture & relance auto.'
      },
      {
        nom: 'Dany Gagné',
        entreprise: 'Peinture & Revêtement Saguenay-Lac',
        email: 'dgagne@peinturesaguenay.ca',
        telephone: '418-545-8811',
        source: 'Prospection RBQ Peinture (Saguenay)',
        statut: 'contacté',
        valeur_estimee: 16000,
        score: 82,
        notes: 'Licence RBQ 5622-9901-08. Peinture commercial & résidentiel. Accroche : Retenues de contrat 10% & conformité CCQ peintres.'
      },
      {
        nom: 'Guillaume Mercier',
        entreprise: 'Peintres Pro-Rive-Sud inc.',
        email: 'gmercier@peintrespro-rivesud.ca',
        telephone: '450-466-2299',
        source: 'Prospection RBQ Peinture (Longueuil)',
        statut: 'nouveau',
        valeur_estimee: 21000,
        score: 85,
        notes: 'Licence RBQ 5809-1143-02. Résidentiel haut de gamme & condo. Accroche : Devis Web interactif SMS avec signature sur écran.'
      },
      {
        nom: 'Éric Castonguay',
        entreprise: 'Peinture Commerciale Laval-Laurentides',
        email: 'ecastonguay@peinturecommercialell.ca',
        telephone: '450-688-4400',
        source: 'Prospection RBQ Peinture (Laval)',
        statut: 'proposition',
        valeur_estimee: 45000,
        score: 94,
        notes: 'Licence RBQ 5790-3321-06. Commercial & industriel. Accroche : Suivi hausse prix matériaux (Banque du Canada / IA) & acompte Stripe.'
      },
      {
        nom: 'Patrick Hétu',
        entreprise: 'Revêtements & Époxy Ouest-Île',
        email: 'phetu@epoxyouestile.ca',
        telephone: '514-694-1188',
        source: 'Prospection RBQ Peinture (West Island)',
        statut: 'qualifié',
        valeur_estimee: 29000,
        score: 89,
        notes: 'Licence RBQ 5833-2210-04. Planchers époxy & peinture spécialisée. Accroche : Pointage mobile des heures pour équipes de nuit.'
      },
      {
        nom: 'Benoit Martel',
        entreprise: 'Peinture Artisanal Rénovations',
        email: 'bmartel@peintureartisanal.ca',
        telephone: '418-529-3355',
        source: 'Prospection RBQ Peinture (Sainte-Foy)',
        statut: 'nouveau',
        valeur_estimee: 13500,
        score: 78,
        notes: 'Licence RBQ 5671-8844-09. Résidentiel & patrimonial. Accroche : Facturation d\'avancement par jalons (Préparation / Apprêt / Finition).'
      },
      {
        nom: 'Simon Archambault',
        entreprise: 'Peintres Associés de Montréal',
        email: 'sarchambault@peintresassociesmtl.ca',
        telephone: '514-270-9911',
        source: 'Prospection RBQ Peinture (Plateau)',
        statut: 'contacté',
        valeur_estimee: 26000,
        score: 86,
        notes: 'Licence RBQ 5766-5501-11. Résidentiel & multi-logements. Accroche : Numérisation photo reçus de peinture et liaison au chantier.'
      },
      {
        nom: 'Charles Perreault',
        entreprise: 'Peinture Industrielle Estrie',
        email: 'cperreault@peintureestrie.ca',
        telephone: '819-563-8822',
        source: 'Prospection RBQ Peinture (Sherbrooke)',
        statut: 'nouveau',
        valeur_estimee: 38000,
        score: 90,
        notes: 'Licence RBQ 5655-4412-07. Industriel & génie. Accroche : Conformité Loi 25 du Québec pour dossiers clients institutionnels.'
      },
      {
        nom: 'Luc Desjardins',
        entreprise: 'Peinture Distinction Nord',
        email: 'ldesjardins@peinturedistinction.ca',
        telephone: '819-425-7744',
        source: 'Prospection RBQ Peinture (Mont-Tremblant)',
        statut: 'qualifié',
        valeur_estimee: 27500,
        score: 87,
        notes: 'Licence RBQ 5781-6632-15. Chalets haut de gamme. Accroche : Signature de devis à distance par SMS sur mobile.'
      },
      // ── 10 PROSPECTS COMMERCIAL & TOITURE / SOUS-TRAITANCE LOURDE ──
      {
        nom: 'Nicolas Gauthier',
        entreprise: 'Les Couvreurs Duro-Toit',
        email: 'ngauthier@durotoit.ca',
        telephone: '514-644-8648',
        source: 'Prospection RBQ Toiture (Montréal)',
        statut: 'qualifié',
        valeur_estimee: 45000,
        score: 95,
        notes: 'Licence RBQ 5618-9920-01. Toits plats, membrane élastomère & commercial. Accroche : Acomptes Stripe automatiques & tableau des retenues 10%.'
      },
      {
        nom: 'Jean-Philippe Perron',
        entreprise: 'René Perron Couvreurs',
        email: 'jpperron@perroncouvreurs.ca',
        telephone: '514-388-5771',
        source: 'Prospection RBQ Toiture (Laval)',
        statut: 'proposition',
        valeur_estimee: 50000,
        score: 96,
        notes: 'Licence RBQ 5701-2244-05. Institutionnel & industriel. Accroche : Suivi automatique des retenues de garantie 10% payables à 60 jours.'
      },
      {
        nom: 'Maxime Plante',
        entreprise: 'Toitures PME inc.',
        email: 'mplante@toiturespme.ca',
        telephone: '450-430-8800',
        source: 'Prospection RBQ Toiture (Blainville)',
        statut: 'nouveau',
        valeur_estimee: 22000,
        score: 84,
        notes: 'Licence RBQ 5788-1122-09. Commercial & multi-logements. Accroche : Signature devis sur téléphone pendant que l\'estimateur est sur le toit.'
      },
      {
        nom: 'Marc-Olivier Riopel',
        entreprise: 'Couvreurs Union inc.',
        email: 'moriopel@toitureunion.ca',
        telephone: '514-325-9900',
        source: 'Prospection RBQ Toiture (Anjou)',
        statut: 'contacté',
        valeur_estimee: 38000,
        score: 90,
        notes: 'Licence RBQ 5741-6602-04. Réfections commerciales & toits plats. Accroche : Calcul automatique TPS/TVQ & marges nettes par chantier.'
      },
      {
        nom: 'Patrick Bissonnette',
        entreprise: 'Toitures Rive-Sud & Fils',
        email: 'pbissonnette@toituresrivesud.ca',
        telephone: '450-655-3311',
        source: 'Prospection RBQ Toiture (Boucherville)',
        statut: 'nouveau',
        valeur_estimee: 19000,
        score: 80,
        notes: 'Licence RBQ 5810-4499-07. Bardeau & résidentiel lourd. Accroche : Pointage mobile des heures pour ouvriers sur chantiers.'
      },
      {
        nom: 'François Spacia',
        entreprise: 'Spacia Construction inc.',
        email: 'fspacia@spaciaconstruction.ca',
        telephone: '514-522-8811',
        source: 'Prospection Commerciale (Montréal)',
        statut: 'qualifié',
        valeur_estimee: 48000,
        score: 93,
        notes: 'Licence RBQ 5612-4410-01. Rénovation commerciale & bureaux. Accroche : Scan OCR factures d\'achat sous-traitants & intégration Loi 25.'
      },
      {
        nom: 'Gilles Malo',
        entreprise: 'Groupe Malo Construction',
        email: 'gmalo@groupemalo.ca',
        telephone: '450-681-3300',
        source: 'Prospection Commerciale (Laval)',
        statut: 'contacté',
        valeur_estimee: 36000,
        score: 88,
        notes: 'Licence RBQ 5801-2244-09. Commerces & bâtiments industriels. Accroche : Facturation d\'avancement par pourcentage de complétion.'
      },
      {
        nom: 'Marc CAMA',
        entreprise: 'Industries CAMA',
        email: 'mcama@industriescama.ca',
        telephone: '819-777-5522',
        source: 'Adjudication SEAO (Gatineau)',
        statut: 'proposition',
        valeur_estimee: 52000,
        score: 97,
        notes: 'Licence RBQ 5690-7711-03. Institutionnel & commercial Outaouais. Accroche : Suivi des avis de retards et conformité aux contrats publics.'
      },
      {
        nom: 'Marc-Luc Tremblay',
        entreprise: 'Électricité Commerciale M.L. inc.',
        email: 'mltremblay@mlelectricite.ca',
        telephone: '514-376-4400',
        source: 'Prospection RBQ Électricité (Rosemont)',
        statut: 'nouveau',
        valeur_estimee: 31000,
        score: 86,
        notes: 'Licence RBQ 5809-3321-04. Électricité commerciale & CCQ. Accroche : Scan photo automatique des factures d\'achat Rexel/Nedco.'
      },
      {
        nom: 'Robert Simard',
        entreprise: 'Plomberie & Chauffage Industriel R.S.',
        email: 'rsimard@rsplomberie.ca',
        telephone: '450-679-2211',
        source: 'Prospection RBQ Plomberie (Longueuil)',
        statut: 'qualifié',
        valeur_estimee: 34000,
        score: 89,
        notes: 'Licence RBQ 5766-2211-08. Tuyauterie commerciale & HVAC. Accroche : Approbation immédiate des extras de chantier sur écran mobile.'
      }
    ]

    const leadsPayload = PROSPECTS_RBQ_SEAO.map((p) => ({
      company_id: companyId,
      nom: p.nom,
      entreprise: p.entreprise,
      email: p.email,
      telephone: p.telephone,
      source: p.source,
      statut: p.statut,
      valeur_estimee: p.valeur_estimee,
      score: p.score,
      notes: p.notes
    }))

    const seedEmails = PROSPECTS_RBQ_SEAO.map(p => p.email).filter(Boolean)
    if (seedEmails.length > 0) {
      await supabase.from('leads').delete().eq('company_id', companyId).in('email', seedEmails)
    }

    const { error: leadsErr } = await supabase
      .from('leads')
      .insert(leadsPayload)

    if (leadsErr) throw leadsErr

    return NextResponse.json({ success: true, message: 'Données démo et prospects RBQ/SEAO générés avec succès !' })
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
    await Promise.all([
      supabase.from('factures').delete().eq('company_id', companyId).like('numero', 'FAC-DEMO-%'),
      supabase.from('devis').delete().eq('company_id', companyId).like('numero', 'DEV-DEMO-%'),
      supabase.from('jobs').delete().eq('company_id', companyId).like('titre', '[DÉMO]%'),
      supabase.from('leads').delete().eq('company_id', companyId).like('email', '%.demo@%'),
      supabase.from('clients').delete().eq('company_id', companyId).like('email', '%.demo@%'),
    ])

    return NextResponse.json({ success: true, message: 'Toutes les données et faux clients démo ont été supprimés avec succès !' })
  } catch (err) {
    console.error('[DELETE /api/admin/seed-demo]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la suppression des données démo' },
      { status: 500 }
    )
  }
}
