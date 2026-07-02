import { NextResponse } from 'next/server'
import { createClient } from './supabase-server'

// Erreur typée : les routes la propagent, apiError() la convertit en réponse HTTP
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Pattern d'auth unique pour toutes les routes API (S2.3).
// Garantit : utilisateur connecté + rattaché à une compagnie.
export async function requireCompany() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, 'Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.company_id) throw new ApiError(400, 'Compagnie introuvable')

  return {
    supabase,
    user,
    companyId: profile.company_id as string,
    role: (profile.role ?? 'owner') as string,
  }
}

// Conversion uniforme erreur → réponse HTTP.
// ApiError = message métier tel quel; tout le reste = log serveur + message générique
// (jamais de détails internes renvoyés au client — S3.4).
export function apiError(err: unknown, tag: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error(tag, err)
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
}
