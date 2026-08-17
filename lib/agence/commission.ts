/** taux 0.008 = 0,80 %. Retourne null si montant ou taux manquant/invalide. */
export function estimateCommission(
  montantPret: number | string | null | undefined,
  tauxCommission: number | string | null | undefined,
): number | null {
  const montant = typeof montantPret === 'string' ? parseFloat(montantPret) : montantPret
  const taux = typeof tauxCommission === 'string' ? parseFloat(tauxCommission) : tauxCommission
  if (montant == null || taux == null) return null
  if (!Number.isFinite(montant) || !Number.isFinite(taux)) return null
  return Math.round(montant * taux * 100) / 100
}

export function withEstimatedCommission(
  patch: Record<string, unknown>,
  current?: { montant_pret?: unknown; taux_commission?: unknown } | null,
): Record<string, unknown> {
  if (patch.commission_brute !== undefined) return patch
  if (patch.montant_pret === undefined && patch.taux_commission === undefined) return patch
  const montant = patch.montant_pret !== undefined ? patch.montant_pret : current?.montant_pret
  const taux = patch.taux_commission !== undefined ? patch.taux_commission : current?.taux_commission
  const estimated = estimateCommission(
    montant as number | string | null | undefined,
    taux as number | string | null | undefined,
  )
  if (estimated != null) patch.commission_brute = estimated
  return patch
}
