import { describe, it, expect } from 'vitest'
import { parseScanJson } from '@/lib/depenses/parse-scan'

describe('parseScanJson', () => {
  it('extrait une facture Home Depot', () => {
    const r = parseScanJson(JSON.stringify({
      fournisseur: 'Home Depot',
      description: 'Home Depot — vis et 2x4',
      montant: 87.43,
      date_depense: '2026-08-12',
      categorie: 'Matériaux',
    }))
    expect(r.montant).toBe(87.43)
    expect(r.categorie).toBe('Matériaux')
    expect(r.date_depense).toBe('2026-08-12')
    expect(r.description).toContain('Home Depot')
  })

  it('accepte un bloc markdown et mappe la catégorie', () => {
    const r = parseScanJson('```json\n{"montant":"120,50","categorie":"essence","fournisseur":"Ultramar"}\n```')
    expect(r.montant).toBe(120.5)
    expect(r.categorie).toBe('Transport')
  })
})
