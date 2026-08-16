import { describe, it, expect } from 'vitest'
import { calcRetenueGarantie, formatCad, CCQ_METIERS } from '@/lib/qc/conformite'

describe('calcRetenueGarantie', () => {
  it('calcule 10 % sur facture sous-traitant', () => {
    const r = calcRetenueGarantie(10000)
    expect(r.montantRetenu).toBe(1000)
    expect(r.montantNet).toBe(9000)
  })

  it('accepte un taux personnalisé', () => {
    const r = calcRetenueGarantie(5000, 0.05)
    expect(r.montantRetenu).toBe(250)
    expect(r.montantNet).toBe(4750)
  })

  it('ne retourne pas de montants négatifs', () => {
    const r = calcRetenueGarantie(-100)
    expect(r.montantRetenu).toBe(0)
    expect(r.montantNet).toBe(0)
  })
})

describe('CCQ_METIERS', () => {
  it('inclut les métiers courants', () => {
    expect(CCQ_METIERS).toContain('Électricien')
    expect(CCQ_METIERS).toContain('Plombier')
  })
})

describe('formatCad', () => {
  it('formate en dollars canadiens', () => {
    expect(formatCad(1234.5)).toMatch(/1[\s\u00a0]?234/)
  })
})
