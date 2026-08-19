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

const DEFAULT_SUPABASE_URL = 'https://uyzltgxufduchvbveiyj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5emx0Z3h1ZmR1Y2h2YnZlaXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgwOTQsImV4cCI6MjA5NzA0NDA5NH0.5LfJxCBcB7zeKVqR3QkRgQei-xjDoiopQaFH7tw9qaA'

let _client: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
    _client = createBrowserClient(url, key)
  }
  return _client
}

// Alias court pour la rétrocompatibilité — préférer getBrowserClient()
export const createClient = getBrowserClient
