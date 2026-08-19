// ⚠️ SERVEUR UNIQUEMENT — Ce client utilise la clé service_role qui BYPASS RLS.
// Ne JAMAIS l'importer depuis un composant client ou exposer sa réponse brute.
// Usage réservé : webhooks (Stripe), flux systèmes sans utilisateur authentifié (join).
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables.'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
