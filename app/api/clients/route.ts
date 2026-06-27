import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 401 })

    const { data } = await supabase
      .from('clients')
      .select('id, nom, email, telephone, ville, created_at')
      .order('nom', { ascending: true })

    return NextResponse.json(data ?? [])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })

    const body = await req.json()
    const { nom, email, telephone, adresse, ville, province, code_postal, notes } = body

    if (!nom?.trim()) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_id: profile.company_id,
        nom: nom.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        ville: ville?.trim() || null,
        province: province || 'QC',
        code_postal: code_postal?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
