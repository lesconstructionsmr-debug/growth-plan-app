export { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

// Retourne le company_id de l'utilisateur connecté
export async function getMyCompanyId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  return data?.company_id ?? null
}
