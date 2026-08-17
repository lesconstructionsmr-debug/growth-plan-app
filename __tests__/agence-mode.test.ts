import { describe, it, expect, vi } from 'vitest'
import { canAccessControlCenter, isPlatformAdmin } from '@/lib/platform-admin'

describe('canAccessControlCenter', () => {
  it('autorise le compte fondateur', () => {
    expect(canAccessControlCenter('max@growth-plan.ca')).toBe(true)
    expect(canAccessControlCenter('Max@growth-plan.ca')).toBe(true)
  })

  it('refuse un client entrepreneur', () => {
    expect(canAccessControlCenter('natasha@example.com')).toBe(false)
    expect(canAccessControlCenter(null)).toBe(false)
  })

  it('autorise un platform admin via env', () => {
    vi.stubEnv('PLATFORM_ADMIN_EMAILS', 'boss@growth-plan.ca')
    expect(isPlatformAdmin('boss@growth-plan.ca')).toBe(true)
    expect(canAccessControlCenter('boss@growth-plan.ca')).toBe(true)
    vi.unstubAllEnvs()
  })
})
