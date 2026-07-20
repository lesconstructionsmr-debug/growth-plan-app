export { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createServerClient(
    url,
    key,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          try { cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]) } catch { /* Server Component */ }
        },
        remove: (name: string, options: Record<string, unknown>) => {
          try { cookieStore.set(name, '', options as Parameters<typeof cookieStore.set>[2]) } catch { /* Server Component */ }
        },
      },
    }
  )
}

// Retourne le company_id de l'utilisateur connecté de manière sécurisée
export async function getMyCompanyId(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', data.user.id)
      .single()

    return profile?.company_id ?? null
  } catch {
    return null
  }
}
