/**
 * Tests unitaires — Intégrité Financière TPS/TVQ
 *
 * Ces calculs produisent de l'argent réel sur des factures légales.
 * Tout écart de 0,01 $ provoque des divergences avec l'ARC / Revenu Québec.
 * Couverture : round2, TPS (5%), TVQ (9.975%), totaux composés.
 */
import { describe, it, expect } from 'vitest'

// On teste la VRAIE implémentation (lib/api/fiscal.ts), pas une copie locale
// qui pourrait diverger du code de production.
import { round2, calculerTotaux as calcTaxes } from '@/lib/api/fiscal'

// ── Tests ─────────────────────────────────────────────────────────────

describe('round2 — Arrondi au centime', () => {
  it('arrondit 1.005 à 1.01', () => expect(round2(1.005)).toBe(1.01))
  it('arrondit 2.4449999 à 2.44', () => expect(round2(2.4449999)).toBe(2.44))
  it('laisse un entier intact', () => expect(round2(100)).toBe(100))
  it('gère zéro', () => expect(round2(0)).toBe(0))
  it('gère les négatifs', () => expect(round2(-1.005)).toBe(-1))
})

describe('calcTaxes — TPS + TVQ (cas nominaux)', () => {
  it('devis 1 ligne 100$ HT avec TPS+TVQ', () => {
    const { montant_ht, tps, tvq, montant_ttc } = calcTaxes(
      [{ quantite: 1, prix_unitaire: 100 }],
      true,
      true
    )
    expect(montant_ht).toBe(100)
    expect(tps).toBe(5)
    expect(tvq).toBe(9.98)       // 100 × 0.09975 = 9.975 → arrondi à 9.98
    expect(montant_ttc).toBe(114.98)
  })

  it('devis 3 lignes — somme correcte avant taxes', () => {
    const { montant_ht } = calcTaxes(
      [
        { quantite: 2, prix_unitaire: 50 },    // 100
        { quantite: 5, prix_unitaire: 14.99 }, // 74.95
        { quantite: 1, prix_unitaire: 0.01 },  // 0.01
      ],
      false,
      false
    )
    expect(montant_ht).toBe(174.96)
  })

  it('sans taxes — montant_ttc = montant_ht', () => {
    const { montant_ht, tps, tvq, montant_ttc } = calcTaxes(
      [{ quantite: 1, prix_unitaire: 500 }],
      false,
      false
    )
    expect(tps).toBe(0)
    expect(tvq).toBe(0)
    expect(montant_ttc).toBe(montant_ht)
  })

  it('TPS seulement (courtier hypothécaire — exempté de TVQ)', () => {
    const { tps, tvq, montant_ttc } = calcTaxes(
      [{ quantite: 1, prix_unitaire: 1000 }],
      true,
      false
    )
    expect(tps).toBe(50)
    expect(tvq).toBe(0)
    expect(montant_ttc).toBe(1050)
  })

  it('évite la divergence classique 0,01$ sur montants décimaux', () => {
    // 333.33 × 0.09975 = 33.2477175 — sans round2 donne 33.24 en troncature Postgres
    // mais 33.25 en affichage JS → divergence de 0,01$
    const { tvq } = calcTaxes(
      [{ quantite: 1, prix_unitaire: 333.33 }],
      false,
      true
    )
    // round2 doit produire exactement 33.25 (arrondi comptable)
    expect(tvq).toBe(33.25)
  })
})

describe('calcTaxes — Cas limites', () => {
  it('montant zéro → tout à zéro', () => {
    const result = calcTaxes([], true, true)
    expect(result.montant_ht).toBe(0)
    expect(result.montant_ttc).toBe(0)
  })

  it('grande facture 100 000$ ne déborde pas', () => {
    const { montant_ht, montant_ttc } = calcTaxes(
      [{ quantite: 1, prix_unitaire: 100000 }],
      true,
      true
    )
    expect(montant_ht).toBe(100000)
    expect(montant_ttc).toBe(114975)
  })
})
