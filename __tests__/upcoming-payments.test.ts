import { describe, it, expect } from 'vitest'
import {
  calculateScheduleSummary,
  UpcomingPaymentItem
} from '@/lib/hooks/useStudioCalculations'

describe('Upcoming Payments · calculateScheduleSummary', () => {
  it('valide un échéancier parfaitement équilibré à 100%', () => {
    const totalTtc = 10000
    const echeances: UpcomingPaymentItem[] = [
      {
        id: '1',
        label: 'Acompte 30%',
        pourcentage: 30,
        montant: 3000,
        date_due: '2026-08-25',
        statut: 'pending',
        methode: 'virement',
      },
      {
        id: '2',
        label: 'Mi-chantier 40%',
        pourcentage: 40,
        montant: 4000,
        date_due: '2026-09-10',
        statut: 'pending',
        methode: 'interac',
      },
      {
        id: '3',
        label: 'Livraison 30%',
        pourcentage: 30,
        montant: 3000,
        date_due: '2026-09-30',
        statut: 'pending',
        methode: 'virement',
      },
    ]

    const summary = calculateScheduleSummary(echeances, totalTtc)

    expect(summary.totalPourcentage).toBe(100)
    expect(summary.totalAlloue).toBe(10000)
    expect(summary.restePourcentage).toBe(0)
    expect(summary.resteMontant).toBe(0)
    expect(summary.isBalanced).toBe(true)
  })

  it('détecte un reste à allouer lorsque le total est inférieur à 100%', () => {
    const totalTtc = 5000
    const echeances: UpcomingPaymentItem[] = [
      {
        id: '1',
        label: 'Dépôt 50%',
        pourcentage: 50,
        montant: 2500,
        date_due: '2026-08-25',
        statut: 'pending',
        methode: 'virement',
      },
    ]

    const summary = calculateScheduleSummary(echeances, totalTtc)

    expect(summary.totalPourcentage).toBe(50)
    expect(summary.totalAlloue).toBe(2500)
    expect(summary.restePourcentage).toBe(50)
    expect(summary.resteMontant).toBe(2500)
    expect(summary.isBalanced).toBe(false)
  })

  it('détecte un dépassement lorsque le total dépasse 100%', () => {
    const totalTtc = 2000
    const echeances: UpcomingPaymentItem[] = [
      {
        id: '1',
        label: 'Tranche 1',
        pourcentage: 60,
        montant: 1200,
        date_due: '2026-08-25',
        statut: 'pending',
        methode: 'virement',
      },
      {
        id: '2',
        label: 'Tranche 2',
        pourcentage: 50,
        montant: 1000,
        date_due: '2026-09-10',
        statut: 'pending',
        methode: 'virement',
      },
    ]

    const summary = calculateScheduleSummary(echeances, totalTtc)

    expect(summary.totalPourcentage).toBe(110)
    expect(summary.isBalanced).toBe(false)
  })
})
