import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET — vérifie le token et retourne les infos de l'invitation
// Client admin obligatoire : l'invité n'a pas encore de company_id,
// donc RLS (invitations_isolation) lui masquait l'invitation → 404 systématique (S2.1)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const admin = createAdminClient()

  const { data: inv } = await admin
    .from('invitations')
    .select('*, companies(name)')
    .eq('token', token)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!inv) return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 })

  return NextResponse.json({
    email:   inv.email,
    role:    inv.role,
    company: (inv.companies as { name: string } | null)?.name ?? 'Votre équipe',
  })
}

// POST — accepter l'invitation (l'utilisateur doit être connecté)
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

    // Session lue via le client cookie (auth), écritures via le client admin (bypass RLS)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Vous devez être connecté pour accepter cette invitation' }, { status: 401 })

    const admin = createAdminClient()

    const { data: inv } = await admin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!inv) return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 })

    // L'invitation est nominative : seul le compte avec cet email peut l'accepter
    if (user.email?.toLowerCase() !== inv.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cette invitation est destinée à une autre adresse courriel' },
        { status: 403 }
      )
    }

    // Option A : un compte déjà rattaché à une AUTRE compagnie ne peut pas migrer
    // (protège un owner contre l'abandon accidentel de sa compagnie et ses données)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (existingProfile?.company_id && existingProfile.company_id !== inv.company_id) {
      return NextResponse.json(
        { error: 'Ce compte appartient déjà à une organisation.' },
        { status: 409 }
      )
    }

    // Rattacher l'utilisateur à la compagnie de l'invitation
    const { error: profileErr } = await admin
      .from('profiles')
      .upsert({
        id:         user.id,
        company_id: inv.company_id,
        role:       inv.role,
      })

    if (profileErr) throw profileErr

    // Marquer l'invitation comme acceptée
    const { error: acceptErr } = await admin
      .from('invitations')
      .update({ accepted: true })
      .eq('id', inv.id)

    if (acceptErr) throw acceptErr

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/join]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
