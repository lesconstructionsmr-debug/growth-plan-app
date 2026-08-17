import { describe, it, expect } from 'vitest'
import { estimateCommission, withEstimatedCommission } from '@/lib/agence/commission'
import { isClosedDossier, buildDossierPatch } from '@/lib/agence/constants'

describe('estimateCommission', () => {
  it('0.008 = 0,80 %', () => {
    expect(estimateCommission(350000, 0.008)).toBe(2800)
  })

  it('retourne null si montant ou taux manquant', () => {
    expect(estimateCommission(null, 0.008)).toBeNull()
    expect(estimateCommission(100000, null)).toBeNull()
  })
})

describe('withEstimatedCommission', () => {
  it('recalcule si montant change', () => {
    const patch = withEstimatedCommission(
      { montant_pret: 200000 },
      { montant_pret: 100000, taux_commission: 0.01 },
    )
    expect(patch.commission_brute).toBe(2000)
  })

  it('ne touche pas si commission_brute déjà fournie', () => {
    const patch = withEstimatedCommission(
      { montant_pret: 200000, commission_brute: 1 },
      { taux_commission: 0.01 },
    )
    expect(patch.commission_brute).toBe(1)
  })
})

describe('isClosedDossier', () => {
  it('ferme uniquement sur etiquette ferme', () => {
    expect(isClosedDossier('finalisation', 'ferme')).toBe(true)
    expect(isClosedDossier('finalisation', 'en_notariat')).toBe(false)
    expect(isClosedDossier('montage', 'ferme')).toBe(true)
  })
})

describe('buildDossierPatch', () => {
  it('whitelist seulement', () => {
    const patch = buildDossierPatch({ phase: 'soumission', secret: 'nope', montant_pret: '150000' })
    expect(patch).toEqual({ phase: 'soumission', montant_pret: 150000 })
    expect(patch).not.toHaveProperty('secret')
  })
})
