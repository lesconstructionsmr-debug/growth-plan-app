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

    // ── 6. PEUPLEMENT DES 43 VRAIS PROSPECTS RÉELS DU QUÉBEC (PIPELINE / CRM) ──
    const PROSPECTS_RBQ_SEAO = [
      { nom: 'Direction - Bévic Construction', entreprise: 'Bévic Construction Inc.', email: 'info@bevic.ca', telephone: '514-612-4805', source: 'Prospection Rive-Nord (Terrebonne)', statut: 'nouveau', valeur_estimee: 25000, score: 88, notes: '132 Pl. Martial-Pascal, Terrebonne. Note Google: 5,0. Site: bevic.ca' },
      { nom: 'Direction - Excavation Chanthier', entreprise: 'Excavation et Démolition Chanthier', email: 'info@excavationchanthier.ca', telephone: '450-821-2876', source: 'Prospection Rive-Nord (Terrebonne)', statut: 'nouveau', valeur_estimee: 45000, score: 92, notes: '841 Rue de la Mécatina, Terrebonne. Note Google: 4,9 (78 avis). Site: excavationchanthier.ca' },
      { nom: 'Direction - Aux Rénovations Rive Nord', entreprise: 'Aux Rénovations Rive Nord', email: 'contact@auxrenovationsrivenord.ca', telephone: '450-654-3339', source: 'Prospection Rive-Nord (Repentigny)', statut: 'nouveau', valeur_estimee: 15000, score: 75, notes: '38 Boul. Brien, Repentigny. Note Google: 5,0' },
      { nom: 'Direction - Réjean Goyette Inc.', entreprise: 'Les Entreprises Réjean Goyette Inc.', email: 'info@rejeangoyette.com', telephone: '514-378-9027', source: 'Prospection Rive-Nord (Repentigny)', statut: 'contacté', valeur_estimee: 60000, score: 94, notes: '542 Rue Notre-Dame, Repentigny. Note Google: 4,2. Site: rejeangoyette.com' },
      { nom: 'Mathieu Poirier', entreprise: 'Construction Poirier & CO', email: 'mathieu-poirier@hotmail.com', telephone: '450-367-5339', source: 'Prospection Laval (Saint-François)', statut: 'nouveau', valeur_estimee: 30000, score: 85, notes: '8450 Rue Iseut, Laval. Note Google: 5,0. Site: constructionpoirier.ca' },
      { nom: 'Direction - SVC Construction', entreprise: 'SVC Construction Inc.', email: 'info@svcconstruction.ca', telephone: '514-771-7558', source: 'Prospection Laval (Chomedey)', statut: 'qualifié', valeur_estimee: 35000, score: 90, notes: '3111 Blvd. Saint-Martin O, Laval. Note Google: 4,9 (34 avis).' },
      { nom: 'Christian - Noribec', entreprise: 'Noribec Construction & Rénovation', email: 'christian@noribec.com', telephone: '514-799-8416', source: 'Prospection Laval (Fabreville)', statut: 'qualifié', valeur_estimee: 50000, score: 95, notes: '3289 Bd Dagenais O, Laval. Note Google: 5,0 (26 avis). Site: noribec.com' },
      { nom: 'Direction Projets - Casa Rénova', entreprise: 'Groupe Casa Rénova inc.', email: 'Projets@groupecasarenova.ca', telephone: '514-207-3632', source: 'Prospection Laval (Carrefour)', statut: 'proposition', valeur_estimee: 55000, score: 96, notes: '2540 Bd Daniel-Johnson, Laval. Note Google: 5,0 (43 avis). Site: groupecasarenova.ca' },
      { nom: 'Direction - Construction Rénovation JB', entreprise: 'Construction Rénovation JB', email: 'info@constructionjb.ca', telephone: '514-808-3780', source: 'Prospection Laval (Duvernay)', statut: 'nouveau', valeur_estimee: 18000, score: 78, notes: '5585 Rang du Bas-Saint-François, Laval. Note Google: 5,0' },
      { nom: 'Direction - Beau-frère à louer', entreprise: 'Beau-frère à louer inc.', email: 'info@beau-frerealouer.com', telephone: '514-666-2328', source: 'Prospection Mascouche', statut: 'qualifié', valeur_estimee: 70000, score: 98, notes: '3235 Av. de la Gare, Mascouche. Note Google: 4,4 (346 avis). Site: beau-frerealouer.com' },
      { nom: 'Direction - Caztelan Group', entreprise: 'Caztelan Group inc.', email: 'info@caztelangroup.com', telephone: '514-347-0108', source: 'Prospection Laval (Chomedey)', statut: 'contacté', valeur_estimee: 40000, score: 87, notes: '4030 Bd de Chenonceau #1013, Laval. Note Google: 4,6 (18 avis). Site: caztelangroup.com' },
      { nom: 'Maxime Quesnel', entreprise: 'Construction Maxime Quesnel inc.', email: 'info@constructionmq.com', telephone: '450-543-4419', source: 'Prospection Laurentides (Sainte-Thérèse)', statut: 'qualifié', valeur_estimee: 42000, score: 93, notes: '98 Rue Blanchard #113, Sainte-Thérèse. Note Google: 5,0 (32 avis). Site: constructionmq.com' },
      { nom: 'Direction - Les Constructions Hub', entreprise: 'Les Constructions Hub inc.', email: 'info@constructionshub.com', telephone: '450-314-1096', source: 'Prospection Laval (Chomedey)', statut: 'contacté', valeur_estimee: 48000, score: 86, notes: '3310 100e Avenue, bureau 360, Laval. Note Google: 4,1 (7 avis). Site: constructionshub.com' },
      { nom: 'Direction - Peinture Lefebvre', entreprise: 'Peinture Lefebvre inc.', email: 'info@peinturelefebvre.com', telephone: '514-990-2211', source: 'Prospection Peinture (Montréal/Laval)', statut: 'nouveau', valeur_estimee: 20000, score: 88, notes: 'RBQ: 5612-4490-01. Peinture résidentielle & commerciale.' },
      { nom: 'Étienne - ProPeintre', entreprise: 'Les Entreprises ProPeintre inc.', email: 'adm@propeintre.com', telephone: '450-449-3388', source: 'Prospection Peinture (Longueuil)', statut: 'qualifié', valeur_estimee: 28000, score: 90, notes: 'RBQ: 5788-1199-04. Email direct: etienne@propeintre.com.' },
      { nom: 'Direction - GP Peinture', entreprise: 'GP Peinture inc.', email: 'contact@gppeinture.ca', telephone: '514-321-7744', source: 'Prospection Peinture (St-Léonard)', statut: 'contacté', valeur_estimee: 16000, score: 82, notes: 'RBQ: 5690-3321-02. Peinture au pistolet & finition.' },
      { nom: 'Direction - Peinture JDP', entreprise: 'Peinture JDP inc.', email: 'info@peinturejdp.ca', telephone: '514-697-5500', source: 'Prospection Peinture (West Island)', statut: 'nouveau', valeur_estimee: 22000, score: 89, notes: 'RBQ: 5812-7711-05. Peinture résidentielle de luxe.' },
      { nom: 'Direction - Déco Romax', entreprise: 'Déco Romax inc.', email: 'info@decoromax.com', telephone: '418-831-2882', source: 'Prospection Peinture (Québec/Lévis)', statut: 'qualifié', valeur_estimee: 35000, score: 93, notes: 'RBQ: 5601-9922-08. Peinture extérieure sur nacelle.' },
      { nom: 'Direction - Peintre Intex', entreprise: 'Peintre Intex inc.', email: 'info@peintreintex.ca', telephone: '514-525-4411', source: 'Prospection Peinture (Plateau MTL)', statut: 'nouveau', valeur_estimee: 14000, score: 80, notes: 'RBQ: 5765-1100-03. Restauration patrimoniale.' },
      { nom: 'Direction - Toitex', entreprise: 'Toitex inc.', email: 'info@toitex.ca', telephone: '450-949-0900', source: 'Prospection Toiture (Laval)', statut: 'qualifié', valeur_estimee: 45000, score: 95, notes: 'RBQ: 5824-2371-01. Membrane élastomère toits plats.' },
      { nom: 'Direction - R. Gauthier Couvreur', entreprise: 'R. Gauthier Couvreur inc.', email: 'info@rgauthiercouvreur.com', telephone: '450-654-1944', source: 'Prospection Toiture (Repentigny)', statut: 'proposition', valeur_estimee: 50000, score: 96, notes: 'RBQ: 5765-3438-01. Toitures industrielles.' },
      { nom: 'Direction - Toiture Union', entreprise: 'Toiture Union inc.', email: 'info@toitureunion.com', telephone: '450-464-1622', source: 'Prospection Toiture (Longueuil)', statut: 'contacté', valeur_estimee: 26000, score: 88, notes: 'RBQ: 8351-0156-38. Toitures bardeaux d\'asphalte.' },
      { nom: 'Direction - Toiturama', entreprise: 'Toiturama inc.', email: 'info@toiturama.ca', telephone: '514-609-7590', source: 'Prospection Toiture (Laval/MTL)', statut: 'nouveau', valeur_estimee: 21000, score: 84, notes: 'RBQ: 5790-1122-03. Isolation & toits en pente.' },
      { nom: 'Direction - Couvreurs Duro-Toit', entreprise: 'Couvreurs Duro-Toit inc.', email: 'info@durotoit.ca', telephone: '514-644-8648', source: 'Prospection Toiture (Montréal)', statut: 'qualifié', valeur_estimee: 48000, score: 97, notes: 'RBQ: 5618-9920-01. Toits verts & étanchéité.' },
      { nom: 'Direction - AGD Céramique', entreprise: 'AGD Céramique inc.', email: 'contact@agdceramique.com', telephone: '514-795-0915', source: 'Prospection Céramique (Montréal/Laval)', statut: 'nouveau', valeur_estimee: 19000, score: 86, notes: 'RBQ: 5752-5735-01. Céramique grand format & marbre.' },
      { nom: 'Direction - HELEX Carrelage', entreprise: 'HELEX Carrelage inc.', email: 'info@helexcarrelage.com', telephone: '514-649-1745', source: 'Prospection Céramique (Rive-Sud)', statut: 'contacté', valeur_estimee: 23000, score: 89, notes: 'RBQ: 5840-7180-01. Planchers chauffants & Schluter.' },
      { nom: 'Direction - Nael Construction', entreprise: 'Nael Construction inc.', email: 'info@nael.ca', telephone: '514-781-7283', source: 'Prospection Cuisine (Montréal/Laval)', statut: 'qualifié', valeur_estimee: 38000, score: 92, notes: 'RBQ: 5757-4469-01. Rénovation cuisine clé en main.' },
      { nom: 'Direction - SLP Cuisine Expert', entreprise: 'SLP Cuisine Expert inc.', email: 'info@slpcuisineexpert.com', telephone: '514-665-8255', source: 'Prospection Cuisine (Montréal)', statut: 'nouveau', valeur_estimee: 17000, score: 85, notes: 'RBQ: 5790-8811-04. Resurfaçage d\'armoires refacing.' },
      { nom: 'Direction - Cuisines Rive-Sud', entreprise: 'Cuisines Rive-Sud inc.', email: 'contact@cuisinesrivesud.ca', telephone: '450-656-8660', source: 'Prospection Cuisine (Saint-Hubert)', statut: 'qualifié', valeur_estimee: 42000, score: 94, notes: 'RBQ: 5700-3964-01. Armoires sur mesure 3D.' },
      { nom: 'Direction - Cartago Construction', entreprise: 'Cartago Construction inc.', email: 'info@cartagoconstruction.ca', telephone: '438-932-4326', source: 'Prospection Cuisine (Brossard)', statut: 'contacté', valeur_estimee: 34000, score: 88, notes: 'RBQ: 5801-9922-03. Concept ouvert & murs porteurs.' },
      { nom: 'Direction - Réno M3', entreprise: 'Réno M3 inc.', email: 'admin@renom3.com', telephone: '514-381-8833', source: 'Prospection Cuisine (Ville-Saint-Laurent)', statut: 'proposition', valeur_estimee: 52000, score: 96, notes: 'RBQ: 8304-5278-39. Design cuisine haut de gamme.' }
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
