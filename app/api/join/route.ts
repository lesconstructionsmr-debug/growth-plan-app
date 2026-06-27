import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

// GET — vérifie le token et retourne les infos de l'invitation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const supabase = createClient()

  // Vérifier le token (utiliser service role pour lire sans RLS)
  const { data: inv } = await supabase
    .from('invitations')
    .select('*, companies(name)')
    .eq('token', token)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .single()

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

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Vous devez être connecté pour accepter cette invitation' }, { status: 401 })

    const { data: inv } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!inv) return NextResponse.json({ error: 'Invitation invalide ou expirée' }, { status: 404 })

    // Rattacher l'utilisateur à la compagnie de l'invitation
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id:         user.id,
        company_id: inv.company_id,
        role:       inv.role,
      })

    if (profileErr) throw profileErr

    // Marquer l'invitation comme acceptée
    await supabase
      .from('invitations')
      .update({ accepted: true })
      .eq('id', inv.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
