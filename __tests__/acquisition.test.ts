import { describe, it, expect } from 'vitest'
import { classifySource, scoreLead, cac } from '@/lib/leads/acquisition'

describe('classifySource', () => {
  it('classe Google, Meta, site et le reste', () => {
    expect(classifySource('Google Ads (test)')).toBe('google')
    expect(classifySource('Meta / Instagram')).toBe('meta')
    expect(classifySource('Formulaire site web')).toBe('site')
    expect(classifySource('Landing — Audit ROI')).toBe('site')
    expect(classifySource('Référence')).toBe('autre')
  })
})

describe('scoreLead', () => {
  it('marque chaud une grosse job urgente', () => {
    const s = scoreLead({ typeProjet: 'construction', budget: 'chaud', delai: 'urgent' })
    expect(s.points).toBe(100)
    expect(s.chaleur).toBe('Chaud')
    expect(s.valeurEstimee).toBe(55000)
  })
})

describe('cac', () => {
  it('divise le budget par les demandes', () => {
    expect(cac(2000, 10)).toBe(200)
    expect(cac(2000, 0)).toBeNull()
  })
})
