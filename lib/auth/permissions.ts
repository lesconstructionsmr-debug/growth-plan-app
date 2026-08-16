/** Rôles internes d'une compagnie (profiles.role) */
export type CompanyRole = 'owner' | 'admin' | 'collaborateur' | 'employee'

const ADMIN_ROLES = new Set<CompanyRole>(['owner', 'admin'])
const EMPLOYEE_ROLES = new Set<CompanyRole>(['collaborateur', 'employee'])

/** Normalise les variantes historiques (FR / EN) vers un rôle canonique. */
export function normalizeRole(role: string | null | undefined): CompanyRole {
  const r = (role ?? 'owner').toLowerCase().trim()
  if (r === 'admin' || r === 'administrateur') return 'admin'
  if (r === 'collaborateur' || r === 'employee' || r === 'employe' || r === 'employé') return 'collaborateur'
  if (r === 'owner' || r === 'propriétaire' || r === 'proprietaire') return 'owner'
  return 'owner'
}

export function isCompanyAdmin(role: string | null | undefined): boolean {
  return ADMIN_ROLES.has(normalizeRole(role))
}

export function isEmployee(role: string | null | undefined): boolean {
  return EMPLOYEE_ROLES.has(normalizeRole(role))
}

/** Routes accessibles aux collaborateurs / employés. */
export const EMPLOYEE_ALLOWED_PREFIXES = [
  '/jobs',
  '/calendrier',
  '/parametres',
] as const

/** Sous-routes interdites même dans un préfixe autorisé. */
export const EMPLOYEE_FORBIDDEN_PREFIXES = [
  '/jobs/nouveau',
] as const

/** Routes réservées owner / admin (redirection employés → /jobs). */
export const ADMIN_ONLY_PREFIXES = [
  '/dashboard',
  '/acquisition',
  '/contenu',
  '/leads',
  '/clients',
  '/employes',
  '/sous-traitants',
  '/devis',
  '/factures',
  '/depenses',
  '/ventes',
  '/rapports',
  '/marche',
  '/commissions',
  '/dossiers',
  '/preteurs',
  '/conformite',
  '/admin',
] as const

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  if (isCompanyAdmin(role)) return true

  if (!isEmployee(role)) return true

  if (EMPLOYEE_FORBIDDEN_PREFIXES.some(p => matchesPrefix(pathname, p))) {
    return false
  }

  if (ADMIN_ONLY_PREFIXES.some(p => matchesPrefix(pathname, p))) {
    return false
  }

  return EMPLOYEE_ALLOWED_PREFIXES.some(p => matchesPrefix(pathname, p))
}

/** Href de navigation autorisés pour la sidebar employé. */
export function employeeNavHrefs(): string[] {
  return ['/jobs', '/calendrier', '/parametres']
}

/** Filtre une requête jobs pour un employé via job_assignments (si la table existe). */
export async function getAssignedJobIds(
  supabase: { from: (table: string) => unknown },
  userId: string,
  companyId: string,
): Promise<string[] | null> {
  const { data, error } = await (supabase.from('job_assignments') as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        eq: (col: string, val: string) => Promise<{ data: { job_id: string }[] | null; error: { code?: string; message?: string } | null }>
      }
    }
  })
    .select('job_id')
    .eq('profile_id', userId)
    .eq('company_id', companyId)

  if (error) {
    // 42P01 = table absente — migration job_assignments pas encore appliquée
    if (error.code === '42P01' || error.message?.includes('job_assignments')) {
      return null
    }
    throw error
  }

  return (data ?? []).map(r => r.job_id)
}
