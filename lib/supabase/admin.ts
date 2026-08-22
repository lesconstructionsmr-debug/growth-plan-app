// ⚠️ SERVEUR UNIQUEMENT — Ce client utilise la clé service_role qui BYPASS RLS.
// Ne JAMAIS l'importer depuis un composant client ou exposer sa réponse brute.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://uyzltgxufduchvbveiyj.supabase.co'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error('[FATAL] SUPABASE_SERVICE_ROLE_KEY manquante sur le serveur.')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
