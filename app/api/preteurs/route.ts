import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabase
      .from('preteurs')
      .select('*')
      .order('nom', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    const { data, error } = await supabase
      .from('preteurs')
      .insert({
        company_id:    profile.company_id,
        nom:           body.nom,
        type:          body.type          || 'banque',
        contact_nom:   body.contact_nom   || null,
        contact_email: body.contact_email || null,
        contact_tel:   body.contact_tel   || null,
        notes:         body.notes         || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase.from('preteurs').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur interne' }, { status: 500 })
  }
}
