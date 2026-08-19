export { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_SUPABASE_URL = 'https://uyzltgxufduchvbveiyj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5emx0Z3h1ZmR1Y2h2YnZlaXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgwOTQsImV4cCI6MjA5NzA0NDA5NH0.5LfJxCBcB7zeKVqR3QkRgQei-xjDoiopQaFH7tw9qaA'

export function createClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
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
