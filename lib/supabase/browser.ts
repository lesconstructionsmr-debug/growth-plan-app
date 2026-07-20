/**
 * lib/supabase/browser.ts
 *
 * FACTORY CENTRALISÉ — Client Supabase côté navigateur.
 * Singleton pour éviter de créer plusieurs instances par composant.
 *
 * USAGE dans les composants 'use client' :
 *   import { getBrowserClient } from '@/lib/supabase/browser'
 *   const supabase = getBrowserClient()
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
    _client = createBrowserClient(url, key)
  }
  return _client
}

// Alias court pour la rétrocompatibilité — préférer getBrowserClient()
export const createClient = getBrowserClient
