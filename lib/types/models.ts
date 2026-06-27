/**
 * ERP Construction — Modèles de données (version premium)
 * Conçu pour usage multi-clients (Peinture JTL, Jeremy, futurs clients)
 */

// ============================================
// BRANDED ID TYPES
// Empêche de mélanger un ClientId avec un JobId par erreur
// ============================================

type Brand<T, B> = T & { __brand: B }

export type ClientId = Brand<string, 'ClientId'>
export type LeadId = Brand<string, 'LeadId'>
export type JobId = Brand<string, 'JobId'>
export type EmployeeId = Brand<string, 'EmployeeId'>
export type ExpenseId = Brand<string, 'ExpenseId'>
export type EstimateId = Brand<string, 'EstimateId'>
export type OrganizationId = Brand<string, 'OrganizationId'>
export type UserId = Brand<string, 'UserId'>
export type InvoiceId = Brand<string, 'InvoiceId'>
export type PaymentId = Brand<string, 'PaymentId'>
export type TimeEntryId = Brand<string, 'TimeEntryId'>
export type ClientPortalTokenId = Brand<string, 'ClientPortalTokenId'>

// ============================================
// MONEY — TOUJOURS EN CENTS (entier)
// Pourquoi: 16800.00 + 0.1 en JS peut donner 16800.099999999998
// Pour une app financière, ça ne pardonne pas.
// ============================================

/** Montant en cents. 1680000 = 16 800,00 $ */
export type MoneyAmount = number

export function formatMoney(cents: MoneyAmount, currency = 'CAD'): string {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency }).format(cents / 100)
}

export function toCents(dollars: number): MoneyAmount {
  return Math.round(dollars * 100)
}

// ============================================
// ENUMS
// ============================================

export enum LeadStatus {
  NOUVEAU = 'nouveau',
  CONTACTE = 'contacte',
  QUALIFIE = 'qualifie',
  DEVIS_ENVOYE = 'devis_envoye',
  GAGNE = 'gagne',
  PERDU = 'perdu',
}

export enum JobStatus {
  PLANIFIE = 'planifie',
  EN_COURS = 'en_cours',
  EN_ATTENTE = 'en_attente',
  COMPLETE = 'complete',
  ANNULE = 'annule',
}

export enum JobType {
  RENOVATION = 'renovation',
  PEINTURE_INT = 'peinture_int',
  PEINTURE_EXT = 'peinture_ext',
  PLOMBERIE = 'plomberie',
  ELECTRICITE = 'electricite',
  MENUISERIE = 'menuiserie',
  TOITURE = 'toiture',
  AUTRE = 'autre',
}

export enum EmployeeRole {
  CHEF_CHANTIER = 'chef_chantier',
  OUVRIER = 'ouvrier',
  APPRENTI = 'apprenti',
  ESTIMATEUR = 'estimateur',
  GESTIONNAIRE = 'gestionnaire',
}

/** Rôle d'ACCÈS À L'APP — différent du rôle métier (EmployeeRole) */
export enum AppRole {
  PROPRIETAIRE = 'proprietaire', // voit tout: finances, tous les jobs, gère l'équipe
  GESTIONNAIRE = 'gestionnaire', // voit presque tout, sauf certains réglages sensibles
  CHEF_CHANTIER = 'chef_chantier', // voit SES jobs assignés seulement
  OUVRIER = 'ouvrier', // voit SON horaire et SES jobs seulement
}

export enum ExpenseCategory {
  MATERIEL = 'materiel',
  MAIN_OEUVRE = 'main_oeuvre',
  TRANSPORT = 'transport',
  LOCATION_EQUIPEMENT = 'location_equipement',
  SOUS_TRAITANT = 'sous_traitant',
  AUTRE = 'autre',
}

export enum EstimateStatus {
  BROUILLON = 'brouillon',
  ENVOYE = 'envoye',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire',
}

export enum AttachmentType {
  PHOTO_AVANT = 'photo_avant',
  PHOTO_APRES = 'photo_apres',
  PHOTO_PROGRES = 'photo_progres',
  CONTRAT = 'contrat',
  PERMIS = 'permis',
  FACTURE_FOURNISSEUR = 'facture_fournisseur',
  AUTRE = 'autre',
}

// ============================================
// MIXINS — champs communs réutilisés partout
// ============================================

/** Tout enregistrement appartient à une organisation (multi-tenant) */
interface TenantScoped {
  organization_id: OrganizationId
}

/** Traçabilité — qui a créé/modifié quoi, et quand */
interface AuditFields {
  created_at: string
  created_by: UserId
  updated_at: string
  updated_by: UserId
}

/** Suppression douce — on ne perd JAMAIS de données financières/légales */
interface SoftDelete {
  deleted_at: string | null
}

type BaseRecord = TenantScoped & AuditFields & SoftDelete

// ============================================
// ORGANIZATION — l'entreprise cliente (Peinture JTL, Jeremy, etc.)
// C'est la racine de l'isolation des données (multi-tenant)
// ============================================

export interface Organization {
  id: OrganizationId
  nom: string // "Peinture JTL"
  slug: string // "peinture-jtl" — pour les URLs (app.growth-plan.ca/peinture-jtl)
  proprietaire_id: UserId
  plan: 'starter' | 'pro' | 'enterprise'
  couleurs_marque?: { primaire: string; accent: string }
  actif: boolean
  date_creation: string
}

// ============================================
// USER — compte avec accès à l'app (lié à Supabase Auth)
// Différent de "Employee" qui est le dossier RH/paie
// ============================================

export interface User extends AuditFields, SoftDelete {
  id: UserId // = auth.users.id de Supabase
  organization_id: OrganizationId
  employee_id?: EmployeeId // lien optionnel vers le dossier employé (paie, compétences)
  email: string
  nom_affichage: string
  role: AppRole
  actif: boolean
  derniere_connexion?: string
}

/**
 * Matrice de permissions — utilisée pour afficher/cacher des sections UI
 * et pour les policies RLS Supabase (Row Level Security)
 */
export const ROLE_PERMISSIONS: Record<
  AppRole,
  {
    voir_finances: boolean
    voir_tous_les_jobs: boolean
    voir_jobs_assignes_seulement: boolean
    gerer_employes: boolean
    gerer_leads: boolean
    voir_dashboard_complet: boolean
    modifier_parametres_org: boolean
  }
> = {
  [AppRole.PROPRIETAIRE]: {
    voir_finances: true,
    voir_tous_les_jobs: true,
    voir_jobs_assignes_seulement: false,
    gerer_employes: true,
    gerer_leads: true,
    voir_dashboard_complet: true,
    modifier_parametres_org: true,
  },
  [AppRole.GESTIONNAIRE]: {
    voir_finances: true,
    voir_tous_les_jobs: true,
    voir_jobs_assignes_seulement: false,
    gerer_employes: true,
    gerer_leads: true,
    voir_dashboard_complet: true,
    modifier_parametres_org: false,
  },
  [AppRole.CHEF_CHANTIER]: {
    voir_finances: false,
    voir_tous_les_jobs: false,
    voir_jobs_assignes_seulement: true,
    gerer_employes: false,
    gerer_leads: false,
    voir_dashboard_complet: false,
    modifier_parametres_org: false,
  },
  [AppRole.OUVRIER]: {
    voir_finances: false,
    voir_tous_les_jobs: false,
    voir_jobs_assignes_seulement: true,
    gerer_employes: false,
    gerer_leads: false,
    voir_dashboard_complet: false,
    modifier_parametres_org: false,
  },
}

// ============================================
// ATTACHMENTS — essentiel en construction
// (photos avant/après, permis, contrats signés)
// ============================================

export interface Attachment extends BaseRecord {
  id: string
  parent_type: 'job' | 'lead' | 'estimate' | 'expense'
  parent_id: string
  type: AttachmentType
  url: string
  nom_fichier: string
  taille_octets?: number
  uploaded_by: UserId
}

// ============================================
// CORE ENTITIES
// ============================================

export interface Client extends BaseRecord {
  id: ClientId
  nom: string
  entreprise?: string
  telephone?: string
  email?: string
  adresse?: string
  ville?: string
  code_postal?: string
  type_travail_prefere?: JobType[]
  notes?: string
}

/** Historique des changements de statut — pour analytics et audit */
export interface StatusHistoryEntry {
  statut: string
  date: string
  changed_by: UserId
  raison?: string
}

export interface Lead extends BaseRecord {
  id: LeadId
  client_id: ClientId
  client?: Client
  statut: LeadStatus
  historique_statuts: StatusHistoryEntry[]
  montant_estime?: MoneyAmount
  type_travail: JobType
  source?: 'reference' | 'site_web' | 'reseaux_sociaux' | 'appel_froid' | 'autre'
  date_contact?: string
  date_suivi_prevue?: string
  probabilite_conversion?: number // 0-100
  notes?: string
  tags?: string[]
}

export interface Employee extends BaseRecord {
  id: EmployeeId
  user_id?: UserId // lien vers compte auth si l'employé a un login
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  role: EmployeeRole
  taux_horaire_cents?: MoneyAmount
  date_embauche?: string
  actif: boolean
  competences?: string[]
  couleur_calendrier?: string // pour affichage visuel cohérent
}

export interface JobItem {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire_cents: MoneyAmount
  montant_cents: MoneyAmount
}

export interface JobAssignment {
  employee_id: EmployeeId
  employee?: Employee
  role_sur_chantier?: string
  date_assignation: string
}

export interface Job extends BaseRecord {
  id: JobId
  numero: string // J-0001
  nom: string
  client_id: ClientId
  client?: Client
  lead_id?: LeadId // traçabilité: ce job vient de quel lead
  type: JobType
  adresse: string
  ville: string
  code_postal: string
  description?: string
  statut: JobStatus
  historique_statuts: StatusHistoryEntry[]
  date_debut?: string
  date_fin_prevue?: string
  date_fin_reelle?: string
  items?: JobItem[]
  cout_estime_cents: MoneyAmount
  cout_reel_cents: MoneyAmount
  assignations?: JobAssignment[]
  pourcentage_completion: number // 0-100
  notes?: string
}

export interface Expense extends BaseRecord {
  id: ExpenseId
  job_id: JobId
  job?: Job
  description: string
  montant_cents: MoneyAmount
  categorie: ExpenseCategory
  date: string
  employee_id?: EmployeeId
  fournisseur?: string
  notes?: string
}

export interface Estimate extends BaseRecord {
  id: EstimateId
  numero: string // DEV-001
  lead_id?: LeadId
  client_id: ClientId
  client?: Client
  titre: string
  description?: string
  items: JobItem[]
  sous_total_cents: MoneyAmount
  taux_tps: number // 5%
  taux_tvq: number // 9.975% (Québec)
  montant_tps_cents: MoneyAmount
  montant_tvq_cents: MoneyAmount
  montant_total_cents: MoneyAmount
  statut: EstimateStatus
  date_envoi?: string
  date_acceptation?: string
  date_refus?: string
  validite_jours: number
  conditions?: string
  signature_client?: string // base64 ou URL si signature électronique
}

// ============================================
// DASHBOARD & REPORTING (calculés, pas stockés)
// ============================================

export interface DashboardKPI {
  revenus_mois_cents: MoneyAmount
  revenus_mois_precedent_cents: MoneyAmount
  a_recevoir_cents: MoneyAmount
  nombre_factures_impayees: number
  jobs_actifs: number
  equipes_terrain: number
  leads_pipeline: number
  leads_qualifies: number
}

export interface RevenueDataPoint {
  mois: string
  revenus_cents: MoneyAmount
  couts_cents: MoneyAmount
}

export interface AlertItem {
  id: string
  type: 'facture_retard' | 'budget_depasse' | 'suivi_requis'
  severite: 'info' | 'warning' | 'danger'
  message: string
  lien?: string
  date: string
}

// ============================================
// CALENDAR
// ============================================

export interface CalendarEvent {
  id: string
  job_id?: JobId
  employee_id: EmployeeId
  titre: string
  date: string
  heures: number
  couleur?: string
  notes?: string
}

// ============================================
// VALIDATION CONSTRAINTS (documentées, appliquées via Zod ailleurs)
// ============================================

export const VALIDATION_RULES = {
  client: { nom_min_length: 2, telephone_pattern: /^\d{10}$/ },
  job: { numero_pattern: /^J-\d{4}$/, pourcentage_min: 0, pourcentage_max: 100 },
  estimate: { numero_pattern: /^DEV-\d{3}$/, validite_jours_default: 30 },
} as const

// ============================================
// FACTURE (Invoice) — distincte du Devis
// Devis = AVANT le travail (estimation à approuver)
// Facture = PENDANT/APRÈS (montant dû, suivi de paiement)
// ============================================

export enum InvoiceStatus {
  BROUILLON = 'brouillon',
  ENVOYEE = 'envoyee',
  PAYEE_PARTIELLE = 'payee_partielle',
  PAYEE = 'payee',
  EN_RETARD = 'en_retard',
  ANNULEE = 'annulee',
}

export interface Invoice extends BaseRecord {
  id: InvoiceId
  numero: string // F-1001
  job_id?: JobId
  job?: Job
  estimate_id?: EstimateId // si générée depuis un devis accepté
  client_id: ClientId
  client?: Client
  items: JobItem[]
  sous_total_cents: MoneyAmount
  taux_tps: number
  taux_tvq: number
  montant_tps_cents: MoneyAmount
  montant_tvq_cents: MoneyAmount
  montant_total_cents: MoneyAmount
  montant_paye_cents: MoneyAmount
  montant_du_cents: MoneyAmount // total - payé, recalculé à chaque paiement
  statut: InvoiceStatus
  date_emission: string
  date_echeance: string
  date_paiement_complet?: string
}

// ============================================
// PAIEMENT EN LIGNE — lié à une facture
// reference_transaction = l'ID retourné par le processeur (Stripe, etc.)
// ============================================

export enum PaymentMethod {
  CARTE_CREDIT = 'carte_credit',
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  COMPTANT = 'comptant',
  INTERAC = 'interac',
}

export enum PaymentStatus {
  EN_ATTENTE = 'en_attente',
  REUSSI = 'reussi',
  ECHEC = 'echec',
  REMBOURSE = 'rembourse',
}

export interface Payment extends BaseRecord {
  id: PaymentId
  invoice_id: InvoiceId
  invoice?: Invoice
  montant_cents: MoneyAmount
  methode: PaymentMethod
  statut: PaymentStatus
  reference_transaction?: string // ex: pi_xxx de Stripe
  date_paiement: string
  notes?: string
}

// ============================================
// PORTAIL CLIENT — accès sécurisé SANS compte complet
// Le client final reçoit un lien magique (token) par email/SMS
// pour voir et approuver son devis, ou payer sa facture
// ============================================

export interface ClientPortalToken {
  id: ClientPortalTokenId
  client_id: ClientId
  resource_type: 'estimate' | 'invoice'
  resource_id: string
  token: string // valeur aléatoire sécurisée — utilisée dans l'URL (ex: /portail/abc123)
  expire_le: string
  utilise_le?: string
  date_creation: string
}

export interface PortalActivity {
  id: string
  token_id: ClientPortalTokenId
  action: 'consultation' | 'approbation' | 'refus' | 'paiement'
  date: string
  ip_adresse?: string
}

// ============================================
// POINTEUSE MOBILE — clock in/out avec géolocalisation
// L'employé pointe depuis son téléphone, position GPS enregistrée
// pour confirmer qu'il était bien sur le chantier
// ============================================

export interface GeoLocation {
  latitude: number
  longitude: number
  precision_metres?: number
}

export enum TimeEntryStatus {
  EN_COURS = 'en_cours', // pointé, pas encore sorti
  TERMINE = 'termine',
  MODIFIE_MANUELLEMENT = 'modifie_manuellement', // corrigé par un gestionnaire
}

export interface TimeEntry extends BaseRecord {
  id: TimeEntryId
  employee_id: EmployeeId
  employee?: Employee
  job_id: JobId
  job?: Job
  heure_arrivee: string
  position_arrivee?: GeoLocation
  heure_depart?: string
  position_depart?: GeoLocation
  duree_minutes?: number // calculé automatiquement à la sortie
  statut: TimeEntryStatus
  cout_cents?: MoneyAmount // duree_minutes / 60 * taux_horaire de l'employé
  notes?: string
  modifie_par?: UserId // si un gestionnaire a ajusté l'entrée
}

/**
 * Vérifie si une position est à distance raisonnable du chantier
 * (évite qu'un employé pointe depuis chez lui)
 */
export function estDansLeRayonDuChantier(
  positionEmploye: GeoLocation,
  positionChantier: GeoLocation,
  rayonMetres = 200
): boolean {
  const R = 6371000 // rayon terre en mètres
  const dLat = ((positionChantier.latitude - positionEmploye.latitude) * Math.PI) / 180
  const dLon = ((positionChantier.longitude - positionEmploye.longitude) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((positionEmploye.latitude * Math.PI) / 180) *
      Math.cos((positionChantier.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return distance <= rayonMetres
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface PaginationMeta {
  total: number
  count: number
  per_page: number
  current_page: number
  last_page: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  meta?: PaginationMeta
}
// ============================================

// ALIASES � types locaux pour les pages existantes
export type StatutClient = 'prospect' | 'actif' | 'inactif' | 'archive'
export type StatutDevis = 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'refuse' | 'expire' | 'converti'
export type StatutFacture = 'brouillon' | 'envoyee' | 'vue' | 'partielle' | 'payee' | 'en_retard' | 'annulee'
export type StatutProjet = 'brouillon' | 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
export type RoleUtilisateur = 'proprietaire' | 'admin' | 'employe' | 'sous_traitant'