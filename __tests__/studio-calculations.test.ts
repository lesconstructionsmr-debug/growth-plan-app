import { describe, it, expect } from 'vitest'
import { calculateStudioTotals, StudioLigneItem } from '@/lib/hooks/useStudioCalculations'

describe('calculateStudioTotals', () => {
  it('calcule correctement la marge, les taxes québécoises et le solde', () => {
    const lignes: StudioLigneItem[] = [
      {
        id: '1',
        description: 'Plancher',
        quantite: 100,
        unite: 'pi²',
        prix_unitaire: 10, // Vente 1000$
        cout_unitaire: 6,  // Coût 600$
        total_ligne: 1000,
        total_cout: 600,
        marge_pourcentage: 40,
      },
      {
        id: '2',
        description: 'Peinture',
        quantite: 1,
        unite: 'forfait',
        prix_unitaire: 500, // Vente 500$
        cout_unitaire: 200, // Coût 200$
        total_ligne: 500,
        total_cout: 200,
        marge_pourcentage: 60,
      },
    ]

    const result = calculateStudioTotals(lignes, 0, 'montant', true, true, 0)

    // Sous-total vente : 1500$
    expect(result.sousTotalVente).toBe(1500)
    // Coût total : 800$
    expect(result.coutTotal).toBe(800)
    // Profit net : 700$
    expect(result.profitNet).toBe(700)
    // Marge globale % : (700 / 1500) * 100 = 46.666...
    expect(result.margeGlobalePct).toBeCloseTo(46.67, 1)

    // TPS (5%) : 75$
    expect(result.tps).toBe(75)
    // TVQ (9.975%) : 149.625$
    expect(result.tvq).toBeCloseTo(149.625, 2)
    // Total TTC : 1724.625$
    expect(result.totalTtc).toBeCloseTo(1724.63, 1)
  })

  it('gère les rabais en pourcentage', () => {
    const lignes: StudioLigneItem[] = [
      {
        id: '1',
        description: 'Travaux généraux',
        quantite: 1,
        unite: 'forfait',
        prix_unitaire: 1000,
        cout_unitaire: 500,
        total_ligne: 1000,
        total_cout: 500,
        marge_pourcentage: 50,
      },
    ]

    const result = calculateStudioTotals(lignes, 10, 'pourcentage', true, true, 0)
    // Rabais 10% sur 1000$ = 100$
    expect(result.rabaisMontant).toBe(100)
    expect(result.baseTaxable).toBe(900)
    expect(result.tps).toBe(45)
  })

  it('gère les divisions par zéro sans crash', () => {
    const lignes: StudioLigneItem[] = [
      {
        id: '1',
        description: 'Tâche gratuite',
        quantite: 0,
        unite: 'u',
        prix_unitaire: 0,
        cout_unitaire: 0,
        total_ligne: 0,
        total_cout: 0,
        marge_pourcentage: 0,
      },
    ]

    const result = calculateStudioTotals(lignes, 0, 'montant', true, true, 0)

    expect(result.sousTotalVente).toBe(0)
    expect(result.margeGlobalePct).toBe(0)
    expect(result.totalTtc).toBe(0)
  })
})
