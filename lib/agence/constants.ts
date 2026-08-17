export const PHASES = [
  { id: 'prise_en_charge', label: 'Prise en charge' },
  { id: 'montage', label: 'Montage du dossier' },
  { id: 'soumission', label: 'Soumission' },
  { id: 'approbation', label: 'Approbation' },
  { id: 'finalisation', label: 'Finalisation' },
] as const

export type PhaseId = (typeof PHASES)[number]['id']

export const ETIQUETTES_PAR_PHASE: Record<PhaseId, { id: string; label: string }[]> = {
  prise_en_charge: [
    { id: 'nouveau_lead', label: 'Nouveau lead' },
    { id: 'qualification_initiale', label: 'Qualification initiale' },
    { id: 'mandat_signe', label: 'Mandat signé' },
  ],
  montage: [
    { id: 'documents_demandes', label: 'Documents demandés' },
    { id: 'documents_recus', label: 'Documents reçus' },
    { id: 'dossier_complet', label: 'Dossier complet' },
  ],
  soumission: [
    { id: 'en_analyse', label: 'En analyse' },
    { id: 'soumis_aux_preteurs', label: 'Soumis aux prêteurs' },
    { id: 'reponses_recues', label: 'Réponses reçues' },
  ],
  approbation: [
    { id: 'approbation_conditionnelle', label: 'Approbation conditionnelle' },
    { id: 'conditions_remplies', label: 'Conditions remplies' },
    { id: 'approbation_finale', label: 'Approbation finale' },
  ],
  finalisation: [
    { id: 'en_notariat', label: 'En notariat' },
    { id: 'acte_signe', label: 'Acte signé' },
    { id: 'fonds_debloques', label: 'Fonds débloqués' },
    { id: 'commissionne', label: 'Commissionné' },
    { id: 'ferme', label: 'Fermé' },
  ],
}

export const TYPE_TRANSACTION = [
  { id: 'achat', label: 'Achat' },
  { id: 'renouvellement', label: 'Renouvellement' },
  { id: 'refinancement', label: 'Refinancement' },
  { id: 'transfert', label: 'Transfert' },
] as const

export const PRETEUR_TYPES = [
  { id: 'banque', label: 'Banque' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'prive', label: 'Privé' },
  { id: 'assureur', label: 'Assureur' },
  { id: 'autre', label: 'Autre' },
] as const

export const COMMISSION_STATUTS = [
  { id: 'a_recevoir', label: 'À recevoir' },
  { id: 'recu', label: 'Reçue' },
  { id: 'annule', label: 'Annulée' },
] as const

export const DOCUMENT_TYPES = [
  { id: 't4', label: 'T4' },
  { id: 'releve1', label: 'Relevé 1' },
  { id: 'avis_cotisation', label: 'Avis de cotisation' },
  { id: 'releve_bancaire', label: 'Relevé bancaire' },
  { id: 'piece_id', label: 'Pièce d\'identité' },
  { id: 'mandat', label: 'Mandat' },
  { id: 'promesse_achat', label: 'Promesse d\'achat' },
  { id: 'evaluation', label: 'Évaluation' },
  { id: 'autre', label: 'Autre' },
] as const

export const DOCUMENT_TYPE_IDS = DOCUMENT_TYPES.map(t => t.id)

export const DOSSIER_PATCH_FIELDS = [
  'phase',
  'etiquette',
  'type_transaction',
  'montant_pret',
  'taux',
  'taux_commission',
  'commission_brute',
  'preteur_id',
  'client_id',
  'assigned_to',
  'date_soumission',
  'date_approbation',
  'date_notariat',
  'date_cloture',
  'notes',
] as const

const NUMERIC_PATCH = new Set(['montant_pret', 'taux', 'taux_commission', 'commission_brute'])
const NULLABLE_IDS = new Set(['preteur_id', 'client_id', 'assigned_to'])
const DATE_FIELDS = new Set(['date_soumission', 'date_approbation', 'date_notariat', 'date_cloture'])

const ETIQUETTE_ALIASES: Record<string, string> = {
  mandat_signé: 'mandat_signe',
}

const ETIQUETTE_LABELS: Record<string, string> = {}
for (const list of Object.values(ETIQUETTES_PAR_PHASE)) {
  for (const e of list) ETIQUETTE_LABELS[e.id] = e.label
}
ETIQUETTE_LABELS.mandat_signé = 'Mandat signé'

export function phaseLabel(phase: string | null | undefined): string {
  if (!phase) return ''
  return PHASES.find(p => p.id === phase)?.label ?? phase
}

export function etiquetteLabel(etiquette: string | null | undefined): string {
  if (!etiquette) return ''
  const id = ETIQUETTE_ALIASES[etiquette] ?? etiquette
  return ETIQUETTE_LABELS[etiquette] ?? ETIQUETTE_LABELS[id] ?? etiquette.replace(/_/g, ' ')
}

/** Fermé si etiquette = ferme (y compris en phase finalisation). */
export function isClosedDossier(phase: string | null | undefined, etiquette: string | null | undefined): boolean {
  return etiquette === 'ferme' || (phase === 'finalisation' && etiquette === 'ferme')
}

export function buildDossierPatch(body: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of DOSSIER_PATCH_FIELDS) {
    if (body[key] === undefined) continue
    const val = body[key]
    if (NUMERIC_PATCH.has(key)) {
      if (val === null || val === '') {
        patch[key] = null
        continue
      }
      const n = typeof val === 'number' ? val : parseFloat(String(val))
      patch[key] = Number.isFinite(n) ? n : null
      continue
    }
    if (NULLABLE_IDS.has(key) || DATE_FIELDS.has(key)) {
      patch[key] = val === '' ? null : val
      continue
    }
    patch[key] = val
  }
  return patch
}
