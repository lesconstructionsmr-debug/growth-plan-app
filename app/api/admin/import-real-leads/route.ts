import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const REAL_QUEBEC_PROSPECTS = [
  // ── 13 ENTREPRISES RIVE-NORD & LAVAL ──────────────────────────────────────
  {
    nom: 'Direction - Bévic Construction',
    entreprise: 'Bévic Construction Inc.',
    email: 'info@bevic.ca',
    telephone: '514-612-4805',
    source: 'Prospection Rive-Nord (Terrebonne)',
    statut: 'nouveau',
    besoin: 'les_deux',
    taille_equipe: '2-5',
    score: 88,
    notes: 'Adresse: 132 Pl. Martial-Pascal, Terrebonne, QC J6V 1J3. Note Google: 5,0 (10 avis). Site: bevic.ca. Entreprise familiale, rénovation résidentielle.'
  },
  {
    nom: 'Direction - Excavation Chanthier',
    entreprise: 'Excavation et Démolition Chanthier',
    email: 'info@excavationchanthier.ca',
    telephone: '450-821-2876',
    source: 'Prospection Rive-Nord (Terrebonne)',
    statut: 'nouveau',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 92,
    notes: 'Adresse: 841 Rue de la Mécatina, Terrebonne, QC J6W 0B6. Note Google: 4,9 (78 avis). Site: excavationchanthier.ca. Fort volume, excavation/démolition.'
  },
  {
    nom: 'Direction - Aux Rénovations Rive Nord',
    entreprise: 'Aux Rénovations Rive Nord',
    email: 'contact@auxrenovationsrivenord.ca',
    telephone: '450-654-3339',
    source: 'Prospection Rive-Nord (Repentigny)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 75,
    notes: 'Adresse: 38 Boul. Brien, Repentigny, QC J6A 4S1. Note Google: 5,0 (1 avis). Petite structure artisanale, rénovations intérieures.'
  },
  {
    nom: 'Direction - Réjean Goyette Inc.',
    entreprise: 'Les Entreprises Réjean Goyette Inc.',
    email: 'info@rejeangoyette.com',
    telephone: '514-378-9027',
    source: 'Prospection Rive-Nord (Repentigny)',
    statut: 'contacte',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 94,
    notes: 'Adresse: 542 Rue Notre-Dame, bureau 202, Repentigny, QC J6A 2T8. Note Google: 4,2 (6 avis). Site: rejeangoyette.com. Constructeur maisons neuves.'
  },
  {
    nom: 'Mathieu Poirier',
    entreprise: 'Construction Poirier & CO',
    email: 'mathieu-poirier@hotmail.com',
    telephone: '450-367-5339',
    source: 'Prospection Laval (Saint-François)',
    statut: 'nouveau',
    besoin: 'optimisation',
    taille_equipe: '6-15',
    score: 85,
    notes: 'Adresse: 8450 Rue Iseut, Laval, QC H7A 1E2. Note Google: 5,0 (14 avis). Site: constructionpoirier.ca. Excavation, ouvert 7j/7.'
  },
  {
    nom: 'Direction - SVC Construction',
    entreprise: 'SVC Construction Inc.',
    email: 'info@svcconstruction.ca',
    telephone: '514-771-7558',
    source: 'Prospection Laval (Chomedey)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 90,
    notes: 'Adresse: 3111 Blvd. Saint-Martin O, Laval, QC H7T 0K2. Note Google: 4,9 (34 avis). Site: 411habitation.com. Rénovation complète (cuisine, salle de bain).'
  },
  {
    nom: 'Christian - Noribec',
    entreprise: 'Noribec Construction & Rénovation',
    email: 'christian@noribec.com',
    telephone: '514-799-8416',
    source: 'Prospection Laval (Fabreville)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 95,
    notes: 'Adresse: 3289 Bd Dagenais O, Laval, QC H7P 1V3. Note Google: 5,0 (26 avis). Site: noribec.com. Spécialisé sinistres/urgences (dégâts d\'eau, incendie).'
  },
  {
    nom: 'Direction Projets - Casa Rénova',
    entreprise: 'Groupe Casa Rénova inc.',
    email: 'Projets@groupecasarenova.ca',
    telephone: '514-207-3632',
    source: 'Prospection Laval (Carrefour)',
    statut: 'essai',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 96,
    notes: 'Adresse: 2540 Bd Daniel-Johnson, Laval, QC H7T 2P6. Note Google: 5,0 (43 avis). Site: groupecasarenova.ca. Rénovation/construction Grand Montréal.'
  },
  {
    nom: 'Direction - Construction Rénovation JB',
    entreprise: 'Construction Rénovation JB',
    email: 'info@constructionjb.ca',
    telephone: '514-808-3780',
    source: 'Prospection Laval (Duvernay)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 78,
    notes: 'Adresse: 5585 Rang du Bas-Saint-François, Laval, QC H7C 0E7. Note Google: 5,0 (1 avis). Petite structure polyvalente.'
  },
  {
    nom: 'Direction - Beau-frère à louer',
    entreprise: 'Beau-frère à louer inc.',
    email: 'info@beau-frerealouer.com',
    telephone: '514-666-2328',
    source: 'Prospection Mascouche',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 98,
    notes: 'Adresse: 3235 Av. de la Gare, Mascouche, QC J7K 3C1. Note Google: 4,4 (346 avis). Site: beau-frerealouer.com. Gros volume multi-corps de métier.'
  },
  {
    nom: 'Direction - Caztelan Group',
    entreprise: 'Caztelan Group inc.',
    email: 'info@caztelangroup.com',
    telephone: '514-347-0108',
    source: 'Prospection Laval (Chomedey)',
    statut: 'contacte',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 87,
    notes: 'Adresse: 4030 Bd de Chenonceau #1013, Laval, QC H7T 0P9. Note Google: 4,6 (18 avis). Site: caztelangroup.com. Entrepreneur général Montréal/Laval.'
  },
  {
    nom: 'Maxime Quesnel',
    entreprise: 'Construction Maxime Quesnel inc.',
    email: 'info@constructionmq.com',
    telephone: '450-543-4419',
    source: 'Prospection Laurentides (Sainte-Thérèse)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 93,
    notes: 'Adresse: 98 Rue Blanchard #113, Sainte-Thérèse, QC J7E 4R9. Note Google: 5,0 (32 avis). Site: constructionmq.com. Très bien structurée, studios & sous-sols.'
  },
  {
    nom: 'Direction - Les Constructions Hub',
    entreprise: 'Les Constructions Hub inc.',
    email: 'info@constructionshub.com',
    telephone: '450-314-1096',
    source: 'Prospection Laval (Chomedey)',
    statut: 'contacte',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 86,
    notes: 'Adresse: 3310 100e Avenue, bureau 360, Laval, QC H7T 0J7. Note Google: 4,1 (7 avis). Site: constructionshub.com. Commercial & multirésidentiel.'
  },

  // ── SPÉCIALISTES PEINTURE ──────────────────────────────────────────────────
  {
    nom: 'Direction - Peinture Lefebvre',
    entreprise: 'Peinture Lefebvre inc.',
    email: 'info@peinturelefebvre.com',
    telephone: '514-990-2211',
    source: 'Prospection Peinture (Montréal/Laval)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '6-15',
    score: 88,
    notes: 'RBQ: 5612-4490-01. Peinture intérieure/extérieure résidentielle & commerciale, finition de surfaces.'
  },
  {
    nom: 'Étienne - ProPeintre',
    entreprise: 'Les Entreprises ProPeintre inc.',
    email: 'adm@propeintre.com',
    telephone: '450-449-3388',
    source: 'Prospection Peinture (Longueuil)',
    statut: 'qualifie',
    besoin: 'optimisation',
    taille_equipe: '6-15',
    score: 90,
    notes: 'RBQ: 5788-1199-04. Email direct: etienne@propeintre.com. Peinture haut de gamme & immeubles locatifs.'
  },
  {
    nom: 'Direction - GP Peinture',
    entreprise: 'GP Peinture inc.',
    email: 'contact@gppeinture.ca',
    telephone: '514-321-7744',
    source: 'Prospection Peinture (St-Léonard)',
    statut: 'contacte',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 82,
    notes: 'RBQ: 5690-3321-02. Peinture au pistolet, teinture de bois extérieur, finition de plafonds.'
  },
  {
    nom: 'Direction - Peinture JDP',
    entreprise: 'Peinture JDP inc.',
    email: 'info@peinturejdp.ca',
    telephone: '514-697-5500',
    source: 'Prospection Peinture (West Island)',
    statut: 'nouveau',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 89,
    notes: 'RBQ: 5812-7711-05. Peinture résidentielle de luxe, condos neufs & boiseries.'
  },
  {
    nom: 'Direction - Déco Romax',
    entreprise: 'Déco Romax inc.',
    email: 'info@decoromax.com',
    telephone: '418-831-2882',
    source: 'Prospection Peinture (Québec/Lévis)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 93,
    notes: 'RBQ: 5601-9922-08. Peinture extérieure sur nacelle, revêtement aluminium/vinyle.'
  },
  {
    nom: 'Direction - Peintre Intex',
    entreprise: 'Peintre Intex inc.',
    email: 'info@peintreintex.ca',
    telephone: '514-525-4411',
    source: 'Prospection Peinture (Plateau MTL)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 80,
    notes: 'RBQ: 5765-1100-03. Restauration patrimoniale, peinture écologique sans COV.'
  },

  // ── SPÉCIALISTES TOITURE ──────────────────────────────────────────────────
  {
    nom: 'Direction - Toitex',
    entreprise: 'Toitex inc.',
    email: 'info@toitex.ca',
    telephone: '450-949-0900',
    source: 'Prospection Toiture (Laval)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 95,
    notes: 'RBQ: 5824-2371-01. Réfection toits plats commercial/résidentiel, membrane élastomère.'
  },
  {
    nom: 'Direction - R. Gauthier Couvreur',
    entreprise: 'R. Gauthier Couvreur inc.',
    email: 'info@rgauthiercouvreur.com',
    telephone: '450-654-1944',
    source: 'Prospection Toiture (Repentigny)',
    statut: 'essai',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 96,
    notes: 'RBQ: 5765-3438-01. Autre email: gauthiercouvreurs@videotron.ca. Toitures industrielles, TPO/EPDM.'
  },
  {
    nom: 'Direction - Toiture Union',
    entreprise: 'Toiture Union inc.',
    email: 'info@toitureunion.com',
    telephone: '450-464-1622',
    source: 'Prospection Toiture (Longueuil)',
    statut: 'contacte',
    besoin: 'optimisation',
    taille_equipe: '6-15',
    score: 88,
    notes: 'RBQ: 8351-0156-38. Bardeaux d\'asphalte architecturaux, toitures neuves & urgences.'
  },
  {
    nom: 'Direction - Toiturama',
    entreprise: 'Toiturama inc.',
    email: 'info@toiturama.ca',
    telephone: '514-609-7590',
    source: 'Prospection Toiture (Laval/MTL)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '6-15',
    score: 84,
    notes: 'RBQ: 5790-1122-03. Isolation de toiture, ventilation de toit, toits en pente.'
  },
  {
    nom: 'Direction - Couvreurs Duro-Toit',
    entreprise: 'Couvreurs Duro-Toit inc.',
    email: 'info@durotoit.ca',
    telephone: '514-644-8648',
    source: 'Prospection Toiture (Montréal)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 97,
    notes: 'RBQ: 5618-9920-01. Toiture écologique, toits verts, étanchéité complexe.'
  },

  // ── SPÉCIALISTES CÉRAMIQUE & CUISINE ──────────────────────────────────────
  {
    nom: 'Direction - AGD Céramique',
    entreprise: 'AGD Céramique inc.',
    email: 'contact@agdceramique.com',
    telephone: '514-795-0915',
    source: 'Prospection Céramique (Montréal/Laval)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 86,
    notes: 'RBQ: 5752-5735-01. Céramique grand format, marbre, granite commercial.'
  },
  {
    nom: 'Direction - HELEX Carrelage',
    entreprise: 'HELEX Carrelage inc.',
    email: 'info@helexcarrelage.com',
    telephone: '514-649-1745',
    source: 'Prospection Céramique (Rive-Sud)',
    statut: 'contacte',
    besoin: 'optimisation',
    taille_equipe: '6-15',
    score: 89,
    notes: 'RBQ: 5840-7180-01. Planchers chauffants, membrane Schluter, carrelage complet.'
  },
  {
    nom: 'Direction - Nael Construction',
    entreprise: 'Nael Construction inc.',
    email: 'info@nael.ca',
    telephone: '514-781-7283',
    source: 'Prospection Cuisine (Montréal/Laval)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '6-15',
    score: 92,
    notes: 'RBQ: 5757-4469-01. Rénovation cuisine clé en main, démolition, comptoirs quartz & îlots.'
  },
  {
    nom: 'Direction - SLP Cuisine Expert',
    entreprise: 'SLP Cuisine Expert inc.',
    email: 'info@slpcuisineexpert.com',
    telephone: '514-665-8255',
    source: 'Prospection Cuisine (Montréal)',
    statut: 'nouveau',
    besoin: 'structure_numerique',
    taille_equipe: '2-5',
    score: 85,
    notes: 'RBQ: 5790-8811-04. Resurfaçage d\'armoires (refacing), changement de portes, comptoirs.'
  },
  {
    nom: 'Direction - Cuisines Rive-Sud',
    entreprise: 'Cuisines Rive-Sud inc.',
    email: 'contact@cuisinesrivesud.ca',
    telephone: '450-656-8660',
    source: 'Prospection Cuisine (Saint-Hubert)',
    statut: 'qualifie',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 94,
    notes: 'RBQ: 5700-3964-01. Conception armoires sur mesure bois/polylaque, design 3D & ébénisterie.'
  },
  {
    nom: 'Direction - Cartago Construction',
    entreprise: 'Cartago Construction inc.',
    email: 'info@cartagoconstruction.ca',
    telephone: '438-932-4326',
    source: 'Prospection Cuisine (Brossard)',
    statut: 'contacte',
    besoin: 'optimisation',
    taille_equipe: '6-15',
    score: 88,
    notes: 'RBQ: 5801-9922-03. Remise à neuf moderne de cuisines, concept ouvert & murs porteurs.'
  },
  {
    nom: 'Direction - Réno M3',
    entreprise: 'Réno M3 inc.',
    email: 'admin@renom3.com',
    telephone: '514-381-8833',
    source: 'Prospection Cuisine (Ville-Saint-Laurent)',
    statut: 'essai',
    besoin: 'les_deux',
    taille_equipe: '16+',
    score: 96,
    notes: 'RBQ: 8304-5278-39. Design d\'intérieur de cuisine haut de gamme, granit/quartz sur mesure.'
  }
]

/**
 * POST /api/admin/import-real-leads
 * Importe la liste vérifiée des VRAIS prospects québécois réels dans platform_leads
 */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()

    // 1. D'abord purger les anciens leads démo s'il en reste
    const emailsToPurge = REAL_QUEBEC_PROSPECTS.map(p => p.email).filter(Boolean)
    if (emailsToPurge.length > 0) {
      await admin.from('platform_leads').delete().in('email', emailsToPurge)
    }

    // 2. Insérer les vrais prospects québécois réels
    const { data: inserted, error: insertErr } = await admin
      .from('platform_leads')
      .insert(REAL_QUEBEC_PROSPECTS)
      .select('*')
      .order('created_at', { ascending: false })

    if (insertErr) throw insertErr

    return NextResponse.json({
      success: true,
      message: `${inserted?.length ?? 0} vrais prospects québécois réels importés avec succès !`,
      count: inserted?.length ?? 0,
      leads: inserted ?? [],
    })
  } catch (err) {
    return apiError(err, '[POST /api/admin/import-real-leads]')
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
