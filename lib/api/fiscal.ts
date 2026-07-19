// Source unique des règles fiscales québécoises (TPS/TVQ) et de l'arrondi
// comptable. Importé par devis.ts, factures.ts ET les tests — jamais dupliqué.

export const TPS_RATE = 0.05
export const TVQ_RATE = 0.09975

// Arrondi au centime, demi-cent vers le haut (norme des logiciels comptables).
// Le décalage relatif (|x|·ε·4) compense l'erreur de représentation binaire :
// sans lui, 1.005*100 = 100.49999999999999 et Math.round donne 100 au lieu de 101.
export const round2 = (n: number) => {
  const x = n * 100
  return Math.round(x + Math.abs(x) * Number.EPSILON * 4) / 100
}

export interface LigneFiscale { quantite: number; prix_unitaire: number }

// Calcul complet HT/TPS/TVQ/TTC — l'unique implémentation de l'app.
export function calculerTotaux(lignes: LigneFiscale[], appliquerTps: boolean, appliquerTvq: boolean) {
  const montant_ht = round2(lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0))
  const tps = appliquerTps ? round2(montant_ht * TPS_RATE) : 0
  const tvq = appliquerTvq ? round2(montant_ht * TVQ_RATE) : 0
  const montant_ttc = round2(montant_ht + tps + tvq)
  return { montant_ht, tps, tvq, montant_ttc }
}
