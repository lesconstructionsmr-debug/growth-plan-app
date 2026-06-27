import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return NextResponse.json([], { status: 200 })

  const { data } = await supabase
    .from('jobs')
    .select('*, clients(nom)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
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

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('jobs').select('id', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
    const numero = `JOB-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        company_id:            profile.company_id,
        client_id:             body.client_id,
        numero,
        titre:                 body.titre,
        description:           body.description ?? null,
        statut:                body.statut ?? 'en_attente',
        adresse_chantier:      body.adresse ?? null,
        ville_chantier:        body.ville ?? null,
        code_postal_chantier:  body.code_postal ?? null,
        rayon_pointage_metres: body.rayon_pointage_metres ?? 200,
        date_debut:            body.date_debut ?? null,
        date_fin_prevue:       body.date_fin_prevue ?? null,
        budget:                body.budget ?? null,
        couleur:               body.couleur ?? '#C9A84C',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/jobs]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
