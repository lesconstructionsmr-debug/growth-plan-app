import 'server-only'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://uyzltgxufduchvbveiyj.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5emx0Z3h1ZmR1Y2h2YnZlaXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NjgwOTQsImV4cCI6MjA5NzA0NDA5NH0.5LfJxCBcB7zeKVqR3QkRgQei-xjDoiopQaFH7tw9qaA'

// Client anon sans session — pour les routes publiques (portail devis, etc.)
export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
