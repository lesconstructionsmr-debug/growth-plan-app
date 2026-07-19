/**
 * Tests unitaires — Verrou atomique anti-double-clic
 *
 * Vérifie la logique de protection contre la création de factures en double
 * lors d'un double-clic sur le bouton de conversion devis→facture.
 * Le verrou fonctionne via un UPDATE conditionnel sur le statut du devis.
 */
import { describe, it, expect } from 'vitest'

// ── Simulation de la logique de verrou (extraite de app/api/devis/[id]/convertir/route.ts) ──

type StatutDevis = 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'converti' | 'refuse' | 'expire'

const ETATS_CONVERTIBLES: StatutDevis[] = ['approuve', 'envoye', 'vu']

/**
 * Simule l'UPDATE atomique Postgres.
 * Retourne le devis mis à jour si la conversion est possible, null sinon.
 */
function tentativeConversion(devis: { statut: StatutDevis } | null): { statut: StatutDevis } | null {
  if (!devis) return null
  if (!ETATS_CONVERTIBLES.includes(devis.statut)) return null
  return { ...devis, statut: 'converti' }
}

function determinerErreur(devis: { statut: StatutDevis } | null): 404 | 409 {
  return devis === null ? 404 : 409
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Verrou atomique conversion devis → facture', () => {
  it('convertit un devis approuvé avec succès', () => {
    const result = tentativeConversion({ statut: 'approuve' })
    expect(result).not.toBeNull()
    expect(result?.statut).toBe('converti')
  })

  it('convertit un devis envoyé avec succès', () => {
    const result = tentativeConversion({ statut: 'envoye' })
    expect(result).not.toBeNull()
  })

  it('convertit un devis vu avec succès', () => {
    const result = tentativeConversion({ statut: 'vu' })
    expect(result).not.toBeNull()
  })

  it('bloque le double-clic : devis déjà converti → null (409)', () => {
    // Simule la 2ème requête simultanée qui arrive après que la 1ère a déjà
    // changé le statut à "converti" — le filtre .in('statut', ETATS_CONVERTIBLES)
    // ne matche plus, l'UPDATE retourne 0 lignes → null → 409
    const result = tentativeConversion({ statut: 'converti' })
    expect(result).toBeNull()
  })

  it('retourne 409 pour un devis déjà converti (pas 404)', () => {
    const devis = { statut: 'converti' as StatutDevis }
    const result = tentativeConversion(devis)
    expect(result).toBeNull()
    expect(determinerErreur(devis)).toBe(409) // Devis existe mais non convertible
  })

  it('retourne 404 pour un devis inexistant', () => {
    const result = tentativeConversion(null)
    expect(result).toBeNull()
    expect(determinerErreur(null)).toBe(404)
  })

  it("bloque la conversion d'un devis refusé", () => {
    const result = tentativeConversion({ statut: 'refuse' })
    expect(result).toBeNull()
  })

  it("bloque la conversion d'un devis brouillon (non encore envoyé)", () => {
    const result = tentativeConversion({ statut: 'brouillon' })
    expect(result).toBeNull()
  })

  it("bloque la conversion d'un devis expiré", () => {
    const result = tentativeConversion({ statut: 'expire' })
    expect(result).toBeNull()
  })
})

describe('Numérotation séquentielle sécurisée', () => {
  function genNumero(prefix: string, year: number, count: number): string {
    return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`
  }

  it('génère DEV-2026-001 pour le premier devis', () => {
    expect(genNumero('DEV', 2026, 0)).toBe('DEV-2026-001')
  })

  it('génère FAC-2026-015 pour la 15ème facture', () => {
    expect(genNumero('FAC', 2026, 14)).toBe('FAC-2026-015')
  })

  it('génère DEV-2026-100 pour le 100ème devis', () => {
    expect(genNumero('DEV', 2026, 99)).toBe('DEV-2026-100')
  })

  it('padding de 3 chiffres — DEV-2026-099 et non DEV-2026-99', () => {
    expect(genNumero('DEV', 2026, 98)).toBe('DEV-2026-099')
  })
})
