// ⚠️ SERVEUR UNIQUEMENT — Ce client utilise la clé service_role (ou anon fallback) qui BYPASS RLS.
// Ne JAMAIS l'importer depuis un composant client ou exposer sa réponse brute.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://uyzltgxufduchvbveiyj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5emx0Z3h1ZmR1Y2h2YnZlaXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgwOTQsImV4cCI6MjA5NzA0NDA5NH0.5LfJxCBcB7zeKVqR3QkRgQei-xjDoiopQaFH7tw9qaA'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
