/**
 * lib/format.ts
 *
 * Utilitaires universels et typés pour le formatage québécois standardisé (CAD & dates).
 * Prévient toute duplication de fonctions locales 'fmt' à travers les composants.
 */

/** Formate un montant en dollars canadiens avec 2 décimales (ex: "1 250,50 $") */
export function formatCad(amount: number | string | null | undefined): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0)
  if (isNaN(n)) return '0,00 $'
  return n.toLocaleString('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Formate un montant en dollars canadiens sans décimales (ex: "1 250 $") */
export function formatCadNoDecimals(amount: number | string | null | undefined): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0)
  if (isNaN(n)) return '0 $'
  return n.toLocaleString('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  })
}

/** Formate une date en format français lisible (ex: "22 août 2026") */
export function formatDateFr(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Formate une date courte (ex: "22 août" ou "22 août 2026") */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
