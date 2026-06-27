// ============================================================
// ERP Construction — Fichier de types complet
// lib/types/models.ts
// ============================================================

// ------------------------------------------------------------
// 1. TYPES SUPABASE DATABASE (squelette — complété par Supabase CLI)
// ------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: Organisation
        Insert: Omit<Organisation, 'id' | 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Omit<Organisation, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Omit<Client, 'id'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'cree_le'>
        Update: Partial<Omit<Contact, 'id'>>
      }
      projets: {
        Row: Projet
        Insert: Omit<Projet, 'id' | 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Omit<Projet, 'id'>>
      }
      devis: {
        Row: Devis
        Insert: Omit<Devis, 'id' | 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Omit<Devis, 'id'>>
      }
      factures: {
        Row: Facture
        Insert: Omit<Facture, 'id' | 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Omit<Facture, 'id'>>
      }
      paiements: {
        Row: Paiement
        Insert: Omit<Paiement, 'id' | 'cree_le'>
        Update: Partial<Omit<Paiement, 'id'>>
      }
      client_portal_tokens: {
        Row: ClientPortalToken
        Insert: Omit<ClientPortalToken, 'id' | 'cree_le'>
        Update: Partial<Omit<ClientPortalToken, 'id'>>
      }
      portal_activites: {
        Row: PortalActivite
        Insert: Omit<PortalActivite, 'id' | 'cree_le'>
        Update: never
      }
      pointages: {
        Row: Pointage
        Insert: Omit<Pointage, 'id' | 'cree_le'>
        Update: Partial<Omit<Pointage, 'id'>>
      }
      lignes_devis: {
        Row: LigneDevis
        Insert: Omit<LigneDevis, 'id'>
        Update: Partial<Omit<LigneDevis, 'id'>>
      }
      lignes_facture: {
        Row: LigneFacture
        Insert: Omit<LigneFacture, 'id'>
        Update: Partial<Omit<LigneFacture, 'id'>>
      }
      profils: {
        Row: Profil
        Insert: Omit<Profil, 'cree_le' | 'mis_a_jour_le'>
        Update: Partial<Profil>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      statut_client: StatutClient
      statut_projet: StatutProjet
      statut_devis: StatutDevis
      statut_facture: StatutFacture
      statut_paiement: StatutPaiement
      type_paiement: TypePaiement
      type_portal_action: TypePortalAction
      role_utilisateur: RoleUtilisateur
    }
  }
}

// ------------------------------------------------------------
// 2. ENUMS
// ------------------------------------------------------------

export type StatutClient = 'prospect' | 'actif' | 'inactif' | 'archive'

export type StatutProjet =
  | 'brouillon'
  | 'en_attente'
  | 'en_cours'
  | 'en_pause'
  | 'termine'
  | 'annule'

export type StatutDevis =
  | 'brouillon'
  | 'envoye'
  | 'vu'
  | 'approuve'
  | 'refuse'
  | 'expire'
  | 'converti'

export type StatutFacture =
  | 'brouillon'
  | 'envoyee'
  | 'vue'
  | 'partielle'
  | 'payee'
  | 'en_retard'
  | 'annulee'

export type StatutPaiement = 'en_attente' | 'complete' | 'echoue' | 'rembourse'

export type TypePaiement =
  | 'virement'
  | 'cheque'
  | 'carte_credit'
  | 'interac'
  | 'especes'
  | 'stripe'
  | 'autre'

export type TypePortalAction = 'consultation' | 'approbation' | 'refus' | 'paiement' | 'telechargement'

export type RoleUtilisateur = 'proprietaire' | 'admin' | 'employe' | 'sous_traitant'

// ------------------------------------------------------------
// 3. ORGANISATION (multi-tenant)
// ------------------------------------------------------------

export interface Organisation {
  id: string                         // uuid
  nom: string
  slug: string                       // utilisé dans les URLs
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  province: string | null
  code_postal: string | null
  pays: string                       // 'CA' par défaut
  logo_url: string | null
  tps_numero: string | null          // numéro TPS fédérale
  tvq_numero: string | null          // numéro TVQ Québec
  taux_tps: number                   // ex: 0.05
  taux_tvq: number                   // ex: 0.09975
  devise: string                     // 'CAD' par défaut
  cree_le: string                    // ISO 8601
  mis_a_jour_le: string
}

// ------------------------------------------------------------
// 4. PROFIL UTILISATEUR
// ------------------------------------------------------------

export interface Profil {
  id: string                         // == auth.users.id
  organisation_id: string
  prenom: string | null
  nom: string | null
  email: string
  telephone: string | null
  role: RoleUtilisateur
  avatar_url: string | null
  actif: boolean
  cree_le: string
  mis_a_jour_le: string
}

// ------------------------------------------------------------
// 5. CLIENT
// ------------------------------------------------------------

export interface Client {
  id: string
  organisation_id: string
  nom: string                        // raison sociale ou nom complet
  type: 'particulier' | 'entreprise'
  statut: StatutClient
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  province: string | null
  code_postal: string | null
  notes: string | null
  source: string | null              // ex: 'facebook', 'referral', 'cold_outreach'
  cree_par: string | null            // profil uuid
  cree_le: string
  mis_a_jour_le: string
}

// ------------------------------------------------------------
// 6. CONTACT (personne liée à un client entreprise)
// ------------------------------------------------------------

export interface Contact {
  id: string
  organisation_id: string
  client_id: string
  prenom: string
  nom: string
  titre: string | null               // ex: 'Directeur des travaux'
  email: string | null
  telephone: string | null
  est_principal: boolean             // contact principal du client
  notes: string | null
  cree_le: string
}

// ------------------------------------------------------------
// 7. PROJET
// ------------------------------------------------------------

export interface Projet {
  id: string
  organisation_id: string
  client_id: string
  titre: string
  description: string | null
  statut: StatutProjet
  adresse_chantier: string | null
  ville_chantier: string | null
  latitude: number | null            // coordonnées GPS du chantier
  longitude: number | null
  rayon_pointage_metres: number      // rayon pour validation GPS (défaut: 200)
  date_debut: string | null          // ISO date
  date_fin_prevue: string | null
  date_fin_reelle: string | null
  budget_estime: number | null
  budget_final: number | null
  couleur: string | null             // ex: '#C9A84C' — pour le calendrier
  responsable_id: string | null      // profil uuid
  cree_par: string | null
  cree_le: string
  mis_a_jour_le: string
}

// ------------------------------------------------------------
// 8. DEVIS (Estimate)
// ------------------------------------------------------------

export interface Devis {
  id: string
  organisation_id: string
  projet_id: string | null
  client_id: string
  numero: string                     // ex: 'DEV-2024-001'
  titre: string
  statut: StatutDevis
  date_emission: string              // ISO date
  date_validite: string | null       // date d'expiration du devis
  sous_total: number
  taux_tps: number
  taux_tvq: number
  montant_tps: number
  montant_tvq: number
  total_ttc: number
  remise_pct: number | null          // % de remise globale
  remise_montant: number | null      // montant de remise calculé
  notes_client: string | null        // visible par le client
  notes_internes: string | null      // internes seulement
  conditions: string | null          // conditions de paiement
  date_approbation: string | null    // quand le client a approuvé
  approuve_par_nom: string | null    // nom saisi par le client dans le portal
  converti_en_facture_le: string | null
  cree_par: string | null
  cree_le: string
  mis_a_jour_le: string
}

export interface LigneDevis {
  id: string
  devis_id: string
  ordre: number                      // ordre d'affichage
  description: string
  quantite: number
  unite: string | null               // ex: 'h', 'm²', 'forfait'
  prix_unitaire: number
  total_ligne: number
  est_optionnel: boolean             // ligne optionnelle (client peut choisir)
}

// ------------------------------------------------------------
// 9. FACTURE (Invoice) — DISTINCT du Devis
// Une facture peut naître d'un devis accepté (estimate_id)
// ------------------------------------------------------------

export interface Facture {
  id: string
  organisation_id: string
  projet_id: string | null
  client_id: string
  devis_id: string | null            // devis source (si convertie depuis un devis)
  numero: string                     // ex: 'FAC-2024-001'
  titre: string
  statut: StatutFacture
  date_emission: string              // date de création / envoi
  date_echeance: string | null       // date limite de paiement
  date_paiement_complet: string | null
  sous_total: number
  taux_tps: number
  taux_tvq: number
  montant_tps: number
  montant_tvq: number
  total_ttc: number
  montant_paye: number               // somme de tous les paiements reçus
  solde_restant: number              // total_ttc - montant_paye
  remise_pct: number | null
  remise_montant: number | null
  notes_client: string | null
  notes_internes: string | null
  conditions: string | null          // ex: '30 jours net'
  cree_par: string | null
  cree_le: string
  mis_a_jour_le: string
}

export interface LigneFacture {
  id: string
  facture_id: string
  ordre: number
  description: string
  quantite: number
  unite: string | null
  prix_unitaire: number
  total_ligne: number
}

// ------------------------------------------------------------
// 10. PAIEMENT (Payment)
// Chaque paiement est lié à une facture.
// reference_transaction = ID retourné par Stripe ou autre processeur.
// ------------------------------------------------------------

export interface Paiement {
  id: string
  organisation_id: string
  facture_id: string
  montant: number
  devise: string                     // 'CAD' par défaut
  type_paiement: TypePaiement
  statut: StatutPaiement
  date_paiement: string              // ISO date
  reference_transaction: string | null  // ID Stripe (pi_xxx, ch_xxx) ou ref manuelle
  processeur: 'stripe' | 'manuel' | null
  notes: string | null
  recu_envoye: boolean               // reçu envoyé au client
  enregistre_par: string | null      // profil uuid
  cree_le: string
}

// ------------------------------------------------------------
// 11. CLIENT PORTAL TOKEN (lien magique — pas de compte requis)
// Le client reçoit un lien magique valide jusqu'à expire_le.
// ------------------------------------------------------------

export interface ClientPortalToken {
  id: string
  organisation_id: string
  client_id: string
  devis_id: string | null            // si lié à un devis
  facture_id: string | null          // si lié à une facture
  token: string                      // UUID aléatoire — clé du lien magique
  expire_le: string                  // ISO datetime — expiration du lien
  utilise_le: string | null          // première utilisation
  est_actif: boolean
  cree_par: string | null            // profil qui a généré le lien
  cree_le: string
}

// URL du portal: https://app.growth-plan.ca/portal?token={token}

// ------------------------------------------------------------
// 12. PORTAL ACTIVITE (audit trail des actions client)
// On trace chaque action pour savoir si le client a vu son
// devis avant de relancer.
// ------------------------------------------------------------

export interface PortalActivite {
  id: string
  token_id: string                   // ClientPortalToken.id
  client_id: string
  action: TypePortalAction           // 'consultation' | 'approbation' | 'refus' | 'paiement' | 'telechargement'
  detail: Json | null                // données contextuelles (ex: { devis_id, montant })
  ip_address: string | null          // pour audit
  user_agent: string | null
  cree_le: string
}

// ------------------------------------------------------------
// 13. POINTAGE / TIME ENTRY (avec géolocalisation)
// Pointage mobile — l'employé poinçonne depuis le chantier.
// On enregistre les coordonnées GPS à l'arrivée et au départ.
// ------------------------------------------------------------

export interface Pointage {
  id: string
  organisation_id: string
  projet_id: string
  employe_id: string                 // profil uuid
  date: string                       // ISO date (YYYY-MM-DD)
  heure_debut: string | null         // ISO datetime (avec timezone)
  heure_fin: string | null
  duree_minutes: number | null       // calculé: (fin - debut) en minutes
  // GPS à l'entrée
  lat_debut: number | null
  lng_debut: number | null
  // GPS à la sortie
  lat_fin: number | null
  lng_fin: number | null
  // Validation géofencing
  dans_rayon_debut: boolean | null   // était dans le rayon du chantier en arrivant
  dans_rayon_fin: boolean | null     // était dans le rayon du chantier en partant
  notes: string | null
  approuve: boolean
  approuve_par: string | null        // profil uuid du gestionnaire
  approuve_le: string | null
  cree_le: string
}

// ------------------------------------------------------------
// 14. HELPERS GÉOLOCALISATION
// ------------------------------------------------------------

/**
 * Calcule la distance en mètres entre deux coordonnées GPS
 * (formule de Haversine).
 */
export function calculerDistanceMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Vérifie que l'employé pointe bien depuis le chantier.
 * Rayon configurable — 200m par défaut.
 *
 * @param projet      Le projet avec latitude/longitude du chantier
 * @param latEmploye  Latitude GPS de l'employé
 * @param lngEmploye  Longitude GPS de l'employé
 * @param rayonMetres Rayon de tolérance (défaut: 200m)
 */
export function estDansLeRayonDuChantier(
  projet: Pick<Projet, 'latitude' | 'longitude' | 'rayon_pointage_metres'>,
  latEmploye: number,
  lngEmploye: number,
  rayonMetres?: number
): boolean {
  if (projet.latitude === null || projet.longitude === null) {
    // Pas de coordonnées configurées → on laisse passer (sans validation GPS)
    return true
  }
  const rayon = rayonMetres ?? projet.rayon_pointage_metres
  const distance = calculerDistanceMetres(
    projet.latitude,
    projet.longitude,
    latEmploye,
    lngEmploye
  )
  return distance <= rayon
}

// ------------------------------------------------------------
// 15. TYPES COMPOSÉS (utiles dans les composants UI)
// ------------------------------------------------------------

/** Devis avec ses lignes */
export interface DevisAvecLignes extends Devis {
  lignes: LigneDevis[]
  client?: Client
  projet?: Projet | null
}

/** Facture avec ses lignes et paiements */
export interface FactureAvecDetails extends Facture {
  lignes: LigneFacture[]
  paiements: Paiement[]
  client?: Client
  projet?: Projet | null
  devis?: Devis | null
}

/** Pointage avec infos de l'employé et du projet */
export interface PointageAvecDetails extends Pointage {
  employe?: Profil
  projet?: Projet
}

/** Token portal avec entités liées */
export interface PortalTokenAvecDetails extends ClientPortalToken {
  client?: Client
  devis?: DevisAvecLignes | null
  facture?: FactureAvecDetails | null
  activites?: PortalActivite[]
}

/** Client avec ses projets et stats */
export interface ClientAvecStats extends Client {
  projets?: Projet[]
  contacts?: Contact[]
  nombre_projets?: number
  total_facture?: number
  total_paye?: number
}

// ------------------------------------------------------------
// 16. TYPES UTILITAIRES
// ------------------------------------------------------------

export type ID = string

/** Réponse Supabase paginée */
export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  par_page: number
  total_pages: number
}

/** Résultat d'action générique */
export interface ActionResult<T = void> {
  succes: boolean
  data?: T
  erreur?: string
}

/** Coordonnées GPS */
export interface Coordonnees {
  latitude: number
  longitude: number
  precision?: number  // en mètres (accuracy de l'API Geolocation)
}
