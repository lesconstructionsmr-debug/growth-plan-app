import { describe, it, expect } from 'vitest'
import { matchJob, extractInboxKey } from '@/lib/depenses/match-job'

const jobs = [
  { id: '1', titre: 'Chalet Tremblant', adresse: '12 rue des Pins' },
  { id: '2', titre: 'Cuisine Rosemont', adresse: null },
]

describe('matchJob', () => {
  it('rattache si le titre du chantier est dans l\'objet', () => {
    expect(matchJob(jobs, 'Facture Home Depot — Chalet Tremblant')?.id).toBe('1')
  })

  it('ne rattache pas si rien ne correspond', () => {
    expect(matchJob(jobs, 'Facture Ultramar')).toBeNull()
  })
})

describe('extractInboxKey', () => {
  it('lit la clé dans l\'adresse', () => {
    expect(extractInboxKey('depenses-ab12cd34ef@inbound.growth-plan.ca')).toBe('ab12cd34ef')
  })
})
