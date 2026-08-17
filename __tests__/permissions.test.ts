import { describe, it, expect } from 'vitest'
import {
  canAccessRoute,
  isCompanyAdmin,
  isEmployee,
  normalizeRole,
} from '@/lib/auth/permissions'

describe('permissions RBAC', () => {
  it('owner et admin ont accès complet', () => {
    expect(isCompanyAdmin('owner')).toBe(true)
    expect(isCompanyAdmin('admin')).toBe(true)
    expect(canAccessRoute('owner', '/dashboard')).toBe(true)
    expect(canAccessRoute('admin', '/ventes')).toBe(true)
  })

  it('employé bloqué sur profits et admin', () => {
    expect(isEmployee('collaborateur')).toBe(true)
    expect(canAccessRoute('collaborateur', '/dashboard')).toBe(false)
    expect(canAccessRoute('collaborateur', '/ventes')).toBe(false)
    expect(canAccessRoute('collaborateur', '/rapports')).toBe(false)
    expect(canAccessRoute('collaborateur', '/devis')).toBe(false)
    expect(canAccessRoute('collaborateur', '/conformite')).toBe(false)
  })

  it('employé autorisé sur chantiers et calendrier', () => {
    expect(canAccessRoute('employee', '/jobs')).toBe(true)
    expect(canAccessRoute('collaborateur', '/jobs/abc')).toBe(true)
    expect(canAccessRoute('collaborateur', '/calendrier')).toBe(true)
    expect(canAccessRoute('collaborateur', '/parametres')).toBe(true)
  })

  it('employé ne peut pas créer de chantier', () => {
    expect(canAccessRoute('collaborateur', '/jobs/nouveau')).toBe(false)
  })

  it('normalise les rôles FR', () => {
    expect(normalizeRole('propriétaire')).toBe('owner')
    expect(normalizeRole('administrateur')).toBe('admin')
    expect(normalizeRole('employé')).toBe('collaborateur')
  })

  it('collaborateur exclu du rôle admin (garde API requireCompanyAdmin)', () => {
    expect(isCompanyAdmin('collaborateur')).toBe(false)
    expect(isCompanyAdmin('employee')).toBe(false)
  })

  it('collab courtier limité aux dossiers, clients, calendrier, parametres', () => {
    expect(canAccessRoute('collaborateur', '/dossiers', 'agence')).toBe(true)
    expect(canAccessRoute('collaborateur', '/clients', 'courtier')).toBe(true)
    expect(canAccessRoute('collaborateur', '/calendrier', 'agence')).toBe(true)
    expect(canAccessRoute('collaborateur', '/parametres', 'agence')).toBe(true)
    expect(canAccessRoute('collaborateur', '/commissions', 'agence')).toBe(false)
    expect(canAccessRoute('collaborateur', '/preteurs', 'agence')).toBe(false)
    expect(canAccessRoute('collaborateur', '/dashboard', 'agence')).toBe(false)
    expect(canAccessRoute('collaborateur', '/jobs', 'agence')).toBe(false)
  })

  it('collab construction inchangé (jobs, pas dossiers)', () => {
    expect(canAccessRoute('collaborateur', '/jobs', 'construction')).toBe(true)
    expect(canAccessRoute('collaborateur', '/dossiers', 'construction')).toBe(false)
    expect(canAccessRoute('collaborateur', '/clients', 'construction')).toBe(false)
  })
})
