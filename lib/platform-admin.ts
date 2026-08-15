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
