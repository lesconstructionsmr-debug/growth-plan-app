import { describe, it, expect } from 'vitest'
import { buildJobTimeline, DOSSIER_KIND_LABELS } from '@/lib/jobs/dossier'

describe('buildJobTimeline', () => {
  const base = {
    jobCreatedAt: '2026-06-01T10:00:00Z',
    jobTitre: 'Cuisine Tremblay',
  }

  it('inclut la création du chantier', () => {
    const events = buildJobTimeline(base)
    expect(events.some(e => e.kind === 'job_created')).toBe(true)
    expect(events[events.length - 1].kind).toBe('job_created')
  })

  it('trie du plus récent au plus ancien', () => {
    const events = buildJobTimeline({
      ...base,
      devis: [{
        id: 'd1', numero: 'DEV-001', titre: 'Soumission',
        statut: 'envoye', montant_ttc: 1000,
        created_at: '2026-06-10T10:00:00Z',
        envoye_le: '2026-06-12T10:00:00Z',
      }],
      pointages: [{
        id: 'p1', date: '2026-06-20', duree_minutes: 480,
        approuve: true, created_at: '2026-06-20T16:00:00Z',
      }],
    })
    expect(events[0].kind).toBe('pointage')
    expect(events.find(e => e.kind === 'devis')).toBeTruthy()
  })

  it('masque les montants si includeFinancials=false', () => {
    const events = buildJobTimeline({
      ...base,
      devis: [{
        id: 'd1', numero: 'DEV-001', titre: null,
        statut: 'brouillon', montant_ttc: 5000,
        created_at: '2026-06-10T10:00:00Z',
      }],
    }, { includeFinancials: false })
    const devisEvent = events.find(e => e.kind === 'devis')
    expect(devisEvent?.montant).toBeNull()
  })

  it('a des labels pour chaque kind', () => {
    expect(DOSSIER_KIND_LABELS.devis).toBe('Devis')
    expect(DOSSIER_KIND_LABELS.pointage).toBe('Pointage')
  })
})
