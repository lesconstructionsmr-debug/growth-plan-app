import { createBrowserClient } from '@supabase/ssr'

function parseCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  return Object.fromEntries(
    document.cookie.split(';').map(c => {
      const [name, ...rest] = c.trim().split('=')
      return [name.trim(), decodeURIComponent(rest.join('='))]
    }).filter(([name]) => name)
  )
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieMap = parseCookies()
          // Merge localStorage backup for any missing auth keys
          if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key?.startsWith('sb-') && !(key in cookieMap)) {
                cookieMap[key] = localStorage.getItem(key) ?? ''
              }
            }
          }
          return Object.entries(cookieMap).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = (options as Record<string, unknown>) ?? {}
            const maxAge = (opts.maxAge as number) ?? 31536000
            const path = (opts.path as string) ?? '/'
            const sameSite = (opts.sameSite as string) ?? 'Lax'
            document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}; max-age=${maxAge}; Secure`
            // Backup in localStorage so PKCE verifier survives cross-origin redirects
            try { localStorage.setItem(name, value) } catch {}
          })
        },
      },
    }
  )
}
