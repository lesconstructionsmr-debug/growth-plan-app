import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name, role')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ vertical: 'construction', role: 'owner', full_name: null, name: 'Mon Entreprise' })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('name, vertical')
      .eq('id', profile.company_id)
      .single()

    return NextResponse.json({
      email:     user.email        || null,
      name:      company?.name     || 'Mon Entreprise',
      vertical:  company?.vertical || 'construction',
      role:      profile.role      || 'owner',
      full_name: profile.full_name || null,
    })
  } catch (err) {
    console.error('[GET /api/me]', err)
    return NextResponse.json({ vertical: 'construction', role: 'owner', full_name: null, name: 'Mon Entreprise' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { vertical } = await req.json()
    if (!vertical || !['construction', 'agence', 'courtier'].includes(vertical)) {
      return NextResponse.json({ error: 'Secteur invalide' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Profil sans entreprise' }, { status: 400 })
    }

    const targetVertical = (vertical === 'courtier' || vertical === 'agence') ? 'agence' : 'construction'

    const { error } = await supabase
      .from('companies')
      .update({ vertical: targetVertical })
      .eq('id', profile.company_id)

    if (error) throw error

    return NextResponse.json({ success: true, vertical: targetVertical })
  } catch (err) {
    console.error('[POST /api/me]', err)
    return NextResponse.json({ error: 'Impossible de changer le mode' }, { status: 500 })
  }
}
