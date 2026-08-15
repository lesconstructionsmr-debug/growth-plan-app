import { NextResponse } from 'next/server'
import { createClient } from './supabase-server'
import { isPlatformAdmin } from '@/lib/platform-admin'

export { isPlatformAdmin }

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function requireAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError(401, 'Non authentifié')
  return { supabase, user }
}

export async function requireCompany() {
  const { supabase, user } = await requireAuth()

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

export async function requirePlatformAdmin() {
  const { supabase, user } = await requireAuth()
  if (!isPlatformAdmin(user.email)) {
    throw new ApiError(403, 'Accès réservé aux administrateurs de la plateforme')
  }
  return { supabase, user }
}

export function apiError(err: unknown, tag: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error(tag, err)
  return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
}
