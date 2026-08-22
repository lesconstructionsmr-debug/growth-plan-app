/** Emails autorisés à accéder à /admin/* et /api/admin/* */
export function platformAdminEmails(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? ''
  return new Set(
    raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  )
}

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return platformAdminEmails().has(email.toLowerCase())
}

const FOUNDER_EMAILS = new Set(['max@growth-plan.ca', 'natasha.heon@gmail.com'])


/** Centre de contrôle Plan Growth (tâches, leads d'adhésion, abonnés) */
export function canAccessControlCenter(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.toLowerCase()
  return isPlatformAdmin(e) || FOUNDER_EMAILS.has(e) || e.endsWith('@growth-plan.ca')
}

/** @deprecated alias — même garde que le centre de contrôle */
export function canUseAgenceMode(email: string | null | undefined): boolean {
  return canAccessControlCenter(email)
}
