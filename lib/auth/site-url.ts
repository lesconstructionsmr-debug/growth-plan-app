const FALLBACK = 'https://app.growth-plan.ca'

/** URL publique de l’app — SITE_URL, BASE_URL et APP_URL sont acceptés. */
export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    FALLBACK
  return raw.replace(/\/$/, '')
}

export function getAuthCallbackUrl() {
  return `${getSiteUrl()}/auth/callback`
}

/** signUp « réussi » sans identities = l’email existe déjà, aucun courriel envoyé. */
export function isDuplicateSignup(user: { identities?: unknown[] | null } | null | undefined) {
  return !!user && (!user.identities || user.identities.length === 0)
}
