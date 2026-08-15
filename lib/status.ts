// Convention unique : statuts sans accents (snake_case ASCII).
// Migration SQL 0006 normalise les données existantes.

export type StatutDevis =
  | 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'refuse' | 'expire' | 'converti'

export type StatutFacture =
  | 'brouillon' | 'envoyee' | 'vue' | 'partielle' | 'payee' | 'en_retard' | 'annulee'

const ACCENT_MAP: Record<string, string> = {
  'envoyé': 'envoye',
  'envoyée': 'envoyee',
  'approuvé': 'approuve',
  'refusé': 'refuse',
  'payée': 'payee',
  'annulée': 'annulee',
}

/** Normalise un statut DB/UI vers la convention sans accents. */
export function normalizeStatut(statut: string | null | undefined, fallback = 'brouillon'): string {
  if (!statut) return fallback
  const stripped = statut.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ACCENT_MAP[statut] ?? stripped ?? fallback
}

export const DEVIS_EN_ATTENTE: StatutDevis[] = ['envoye', 'vu']
export const DEVIS_CONVERTIBLES: StatutDevis[] = ['approuve', 'envoye', 'vu']
export const FACTURES_IMPAYEES: StatutFacture[] = ['envoyee', 'vue', 'partielle', 'en_retard']
