import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUTS = new Set(['incomplet', 'nouveau', 'contacte', 'qualifie', 'essai', 'client', 'perdu'])
const BESOINS = new Set(['structure_numerique', 'optimisation', 'les_deux', 'autre'])

function scoreFromAnswers(besoin?: string, taille?: string): number {
  let p = 20
  if (besoin === 'structure_numerique') p += 25
  if (besoin === 'optimisation') p += 25
  if (besoin === 'les_deux') p += 40
  if (taille === '2-5') p += 15
  if (taille === '6-15') p += 25
  if (taille === '16+') p += 30
  if (taille === 'solo') p += 10
  return Math.min(100, p)
}

const PROSPECTS_SAAS_SEED = [
  { nom: 'Pierre Bolduc', entreprise: 'Construction Bolduc inc.', email: 'p.bolduc@constructionbolduc.ca', telephone: '418-543-9910', source: 'Prospection RBQ (Saguenay)', statut: 'nouveau', besoin: 'les_deux', taille_equipe: '6-15', score: 85, notes: 'Licence RBQ 5612-8901-01. Rénovation commerciale & Multi-logements. Accroche : Retenues 10% & CCQ.' },
  { nom: 'Marc-André Gagnon', entreprise: 'Réno Experts Saguenay', email: 'magagnon@renoexpertssaguenay.ca', telephone: '418-690-2214', source: 'Prospection RBQ (Chicoutimi)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '2-5', score: 80, notes: 'Licence RBQ 5723-1142-04. Résidentiel lourd. Accroche : Estimation rapide devis.' },
  { nom: 'Michel Roy', entreprise: 'Constructions Métropolitaines M.R.', email: 'mroy@constructionsmetropolitaines.ca', telephone: '514-374-8800', source: 'Prospection RBQ (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5801-4432-09. Commercial & Institutionnel. Accroche : Inbox dépenses OCR.' },
  { nom: 'Stéphane Fortin', entreprise: 'Groupe BTP Sommet inc.', email: 'sfortin@btpsommet.ca', telephone: '514-521-4450', source: 'Prospection RBQ (Hochelaga)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '6-15', score: 75, notes: 'Licence RBQ 5789-9921-12. Multi-logements (CONDO/PLEX). Accroche : Prix matériaux.' },
  { nom: 'Jean-François Harvey', entreprise: 'Béton & Structure Nord-Lac', email: 'jfharvey@nordlac-beton.ca', telephone: '418-547-1122', source: 'Prospection RBQ (Jonquière)', statut: 'contacte', besoin: 'les_deux', taille_equipe: '6-15', score: 85, notes: 'Licence RBQ 5634-7712-08. Génie civil & Fondations. Accroche : Pointage mobile.' },
  { nom: 'Alexandre Côté', entreprise: 'Habitations Rive-Sud & Île', email: 'acote@habitationsrivesud.ca', telephone: '450-672-9900', source: 'Prospection RBQ (Rive-Sud)', statut: 'qualifie', besoin: 'optimisation', taille_equipe: '6-15', score: 88, notes: 'Licence RBQ 5812-3390-03. Construction neuve. Accroche : Portail client devis.' },
  { nom: 'Mathieu Tremblay', entreprise: 'Peinture & Revêtement Pro-Mat', email: 'mtremblay@promat-peinture.ca', telephone: '418-668-3311', source: 'Prospection RBQ (Alma)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 70, notes: 'Licence RBQ 5690-2211-05. Peinture commercial. Accroche : Devis m² & TPS/TVQ.' },
  { nom: 'David Lavoie', entreprise: 'Génie-Bâtiment MTL Express', email: 'dlavoie@geniebatimentmtl.ca', telephone: '514-844-5500', source: 'Prospection RBQ (Ville-Marie)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 92, notes: 'Licence RBQ 5744-8831-07. Bureaux & Boutiques. Accroche : Loi 25 & Sécurité.' },
  { nom: 'Éric Simard', entreprise: 'Toitures & Isolation Saguenay', email: 'esimard@toituressaguenay.ca', telephone: '418-549-7700', source: 'Prospection RBQ (Chicoutimi)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 78, notes: 'Licence RBQ 5601-9943-02. Toitures. Accroche : Relance factures auto.' },
  { nom: 'Sylvain Bergeron', entreprise: 'Les Envois & Aménagements Urbains', email: 'sbergeron@amenagurbains.ca', telephone: '514-637-2200', source: 'Adjudication SEAO (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 95, notes: 'Adjudicataire SEAO. Génie civil. Accroche : Conformité SEAO & Retenues 10%.' },
  { nom: 'Jean-Thomas Levesque', entreprise: 'Peinture JTL inc.', email: 'peinture.jtl@gmail.com', telephone: '514-555-4001', source: 'Prospection RBQ Peinture (Laval)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 88, notes: 'Licence RBQ 5689-1020-01. Peinture 9.0. Accroche : Devis m² & déduction gallons.' },
  { nom: 'Frédéric Beaulieu', entreprise: 'Les Grands Peintres du Québec', email: 'fbeaulieu@grandspeintres.ca', telephone: '418-651-7722', source: 'Prospection RBQ Peinture (Québec)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 92, notes: 'Licence RBQ 5712-4409-03. Peinture commerciale. Accroche : Scan OCR factures.' },
  { nom: 'Dany Gagné', entreprise: 'Peinture & Revêtement Saguenay-Lac', email: 'dgagne@peinturesaguenay.ca', telephone: '418-545-8811', source: 'Prospection RBQ Peinture (Saguenay)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 82, notes: 'Licence RBQ 5622-9901-08. Peinture. Accroche : Retenues 10% & CCQ.' },
  { nom: 'Guillaume Mercier', entreprise: 'Peintres Pro-Rive-Sud inc.', email: 'gmercier@peintrespro-rivesud.ca', telephone: '450-466-2299', source: 'Prospection RBQ Peinture (Longueuil)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 85, notes: 'Licence RBQ 5809-1143-02. Résidentiel luxe. Accroche : Devis Web SMS.' },
  { nom: 'Éric Castonguay', entreprise: 'Peinture Commerciale Laval-Laurentides', email: 'ecastonguay@peinturecommercialell.ca', telephone: '450-688-4400', source: 'Prospection RBQ Peinture (Laval)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 94, notes: 'Licence RBQ 5790-3321-06. Commercial. Accroche : Prix matériaux & acompte Stripe.' },
  { nom: 'Patrick Hétu', entreprise: 'Revêtements & Époxy Ouest-Île', email: 'phetu@epoxyouestile.ca', telephone: '514-694-1188', source: 'Prospection RBQ Peinture (West Island)', statut: 'qualifie', besoin: 'optimisation', taille_equipe: '6-15', score: 89, notes: 'Licence RBQ 5833-2210-04. Planchers époxy. Accroche : Pointage mobile équipes de nuit.' },
  { nom: 'Benoit Martel', entreprise: 'Peinture Artisanal Rénovations', email: 'bmartel@peintureartisanal.ca', telephone: '418-529-3355', source: 'Prospection RBQ Peinture (Sainte-Foy)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '2-5', score: 78, notes: 'Licence RBQ 5671-8844-09. Patrimonial. Accroche : Facturation par jalons.' },
  { nom: 'Simon Archambault', entreprise: 'Peintres Associés de Montréal', email: 'sarchambault@peintresassociesmtl.ca', telephone: '514-270-9911', source: 'Prospection RBQ Peinture (Plateau)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '6-15', score: 86, notes: 'Licence RBQ 5766-5501-11. Multi-logements. Accroche : Photo reçus peinture.' },
  { nom: 'Charles Perreault', entreprise: 'Peinture Industrielle Estrie', email: 'cperreault@peintureestrie.ca', telephone: '819-563-8822', source: 'Prospection RBQ Peinture (Sherbrooke)', statut: 'nouveau', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5655-4412-07. Industriel. Accroche : Conformité Loi 25.' },
  { nom: 'Luc Desjardins', entreprise: 'Peinture Distinction Nord', email: 'ldesjardins@peinturedistinction.ca', telephone: '819-425-7744', source: 'Prospection RBQ Peinture (Tremblant)', statut: 'qualifie', besoin: 'structure_numerique', taille_equipe: '2-5', score: 87, notes: 'Licence RBQ 5781-6632-15. Chalets luxe. Accroche : Signature devis à distance SMS.' },
  { nom: 'Nicolas Gauthier', entreprise: 'Les Couvreurs Duro-Toit', email: 'ngauthier@durotoit.ca', telephone: '514-644-8648', source: 'Prospection RBQ Toiture (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 95, notes: 'Licence RBQ 5618-9920-01. Toits plats. Accroche : Acomptes Stripe & Retenues 10%.' },
  { nom: 'Jean-Philippe Perron', entreprise: 'René Perron Couvreurs', email: 'jpperron@perroncouvreurs.ca', telephone: '514-388-5771', source: 'Prospection RBQ Toiture (Laval)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 96, notes: 'Licence RBQ 5701-2244-05. Institutionnel. Accroche : Retenues 10% à 60 jours.' },
  { nom: 'Maxime Plante', entreprise: 'Toitures PME inc.', email: 'mplante@toiturespme.ca', telephone: '450-430-8800', source: 'Prospection RBQ Toiture (Blainville)', statut: 'nouveau', besoin: 'optimisation', taille_equipe: '6-15', score: 84, notes: 'Licence RBQ 5788-1122-09. Multi-logements. Accroche : Signature devis sur toit.' },
  { nom: 'Marc-Olivier Riopel', entreprise: 'Couvreurs Union inc.', email: 'moriopel@toitureunion.ca', telephone: '514-325-9900', source: 'Prospection RBQ Toiture (Anjou)', statut: 'contacte', besoin: 'les_deux', taille_equipe: '16+', score: 90, notes: 'Licence RBQ 5741-6602-04. Commercial. Accroche : TPS/TVQ & Marges nettes.' },
  { nom: 'Patrick Bissonnette', entreprise: 'Toitures Rive-Sud & Fils', email: 'pbissonnette@toituresrivesud.ca', telephone: '450-655-3311', source: 'Prospection RBQ Toiture (Boucherville)', statut: 'nouveau', besoin: 'structure_numerique', taille_equipe: '6-15', score: 80, notes: 'Licence RBQ 5810-4499-07. Résidentiel lourd. Accroche : Pointage mobile ouvriers.' },
  { nom: 'François Spacia', entreprise: 'Spacia Construction inc.', email: 'fspacia@spaciaconstruction.ca', telephone: '514-522-8811', source: 'Prospection Commerciale (Montréal)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 93, notes: 'Licence RBQ 5612-4410-01. Bureaux. Accroche : Scan OCR sous-traitants & Loi 25.' },
  { nom: 'Gilles Malo', entreprise: 'Groupe Malo Construction', email: 'gmalo@groupemalo.ca', telephone: '450-681-3300', source: 'Prospection Commerciale (Laval)', statut: 'contacte', besoin: 'optimisation', taille_equipe: '16+', score: 88, notes: 'Licence RBQ 5801-2244-09. Industriel. Accroche : Facturation par complétion %.' },
  { nom: 'Marc CAMA', entreprise: 'Industries CAMA', email: 'mcama@industriescama.ca', telephone: '819-777-5522', source: 'Adjudication SEAO (Gatineau)', statut: 'essai', besoin: 'les_deux', taille_equipe: '16+', score: 97, notes: 'Licence RBQ 5690-7711-03. Institutionnel Outaouais. Accroche : Retards & SEAO.' },
  { nom: 'Marc-Luc Tremblay', entreprise: 'Électricité Commerciale M.L. inc.', email: 'mltremblay@mlelectricite.ca', telephone: '514-376-4400', source: 'Prospection RBQ Électricité (Rosemont)', statut: 'nouveau', besoin: 'optimisation', taille_equipe: '6-15', score: 86, notes: 'Licence RBQ 5809-3321-04. Électricité CCQ. Accroche : Scan factures Rexel/Nedco.' },
  { nom: 'Robert Simard', entreprise: 'Plomberie & Chauffage Industriel R.S.', email: 'rsimard@rsplomberie.ca', telephone: '450-679-2211', source: 'Prospection RBQ Plomberie (Longueuil)', statut: 'qualifie', besoin: 'les_deux', taille_equipe: '16+', score: 89, notes: 'Licence RBQ 5766-2211-08. Tuyauterie HVAC. Accroche : Approbation extras mobile.' }
]

/** input none / output PlatformLead[] / rôle fondateur */
export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()
    const url = new URL(req.url)
    const forceSeed = url.searchParams.get('seed') === 'true'

    if (forceSeed) {
      const { data: seededData, error: seedErr } = await admin
        .from('platform_leads')
        .insert(PROSPECTS_SAAS_SEED)
        .select('*')
        .order('created_at', { ascending: false })

      if (seedErr) throw seedErr
      return NextResponse.json(seededData ?? [])
    }

    const { data, error } = await admin
      .from('platform_leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error

    if (!data || data.length === 0) {
      // Auto-population automatique si la table platform_leads est vide
      const { data: seededData, error: seedErr } = await admin
        .from('platform_leads')
        .insert(PROSPECTS_SAAS_SEED)
        .select('*')
        .order('created_at', { ascending: false })

      if (!seedErr && seededData) {
        return NextResponse.json(seededData)
      }
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/admin/saas-leads]')
  }
}

/** input { nom, email?, telephone?, entreprise?, source?, besoin?, taille_equipe?, notes?, utm_source?, utm_medium?, utm_campaign?, utm_content? } */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    const nom = typeof body.nom === 'string' ? body.nom.trim() : ''
    if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    const besoin = BESOINS.has(body.besoin) ? body.besoin : null
    const taille = typeof body.taille_equipe === 'string' ? body.taille_equipe : null
    const score = scoreFromAnswers(besoin ?? undefined, taille ?? undefined)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_leads')
      .insert({
        nom,
        email: body.email?.trim() || null,
        telephone: body.telephone?.trim() || null,
        entreprise: body.entreprise?.trim() || null,
        source: body.source?.trim() || 'manuel',
        statut: STATUTS.has(body.statut) ? body.statut : 'nouveau',
        besoin,
        taille_equipe: taille,
        score,
        notes: body.notes?.trim() || null,
        utm_source: body.utm_source?.trim() || null,
        utm_medium: body.utm_medium?.trim() || null,
        utm_campaign: body.utm_campaign?.trim() || null,
        utm_content: body.utm_content?.trim() || null,
        abandoned_at: body.statut === 'incomplet' ? new Date().toISOString() : null,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/admin/saas-leads]')
  }
}

/** input { id, ...fields } */
export async function PATCH(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    for (const key of ['nom', 'email', 'telephone', 'entreprise', 'source', 'notes', 'taille_equipe', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const) {
      if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key]
    }
    if (body.statut !== undefined) {
      if (!STATUTS.has(body.statut)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      updates.statut = body.statut
      if (body.statut === 'incomplet') updates.abandoned_at = new Date().toISOString()
    }
    if (body.besoin !== undefined) {
      updates.besoin = BESOINS.has(body.besoin) ? body.besoin : null
    }
    if (body.besoin !== undefined || body.taille_equipe !== undefined) {
      updates.score = scoreFromAnswers(
        (updates.besoin as string) ?? body.besoin,
        (updates.taille_equipe as string) ?? body.taille_equipe,
      )
    }
    if (body.score !== undefined) updates.score = body.score

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_leads')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/admin/saas-leads]')
  }
}

/** input ?id= */
export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    const admin = createAdminClient()
    const { data, error } = await admin.from('platform_leads').delete().eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/admin/saas-leads]')
  }
}
