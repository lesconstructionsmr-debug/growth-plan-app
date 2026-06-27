import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await supabase
      .from('dossiers')
      .select(`
        id, numero, phase, etiquette, type_transaction,
        montant_pret, commission_brute, notes, created_at,
        clients(nom),
        preteurs(nom)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('[GET /api/dossiers]', err)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { client_nom, type_transaction, montant_pret, phase, notes } = await req.json()

    // Récupérer company_id
    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    // Créer ou trouver le client
    let client_id: string | null = null
    if (client_nom?.trim()) {
      const { data: existing } = await supabase
        .from('clients').select('id').eq('company_id', profile.company_id).ilike('nom', client_nom.trim()).limit(1).single()

      if (existing) {
        client_id = existing.id
      } else {
        const { data: newClient } = await supabase
          .from('clients').insert({ company_id: profile.company_id, nom: client_nom.trim() }).select('id').single()
        client_id = newClient?.id || null
      }
    }

    // Numéro auto
    const now = new Date()
    const yy  = String(now.getFullYear()).slice(-2)
    const mm  = String(now.getMonth() + 1).padStart(2, '0')
    const dd  = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 9000 + 1000))
    const numero = `DOS-${yy}${mm}${dd}-${rand}`

    const { data, error } = await supabase
      .from('dossiers')
      .insert({
        company_id:       profile.company_id,
        client_id,
        numero,
        phase:            phase || 'prise_en_charge',
        etiquette:        'nouveau_lead',
        type_transaction: type_transaction || 'achat',
        montant_pret:     montant_pret ? parseFloat(montant_pret) : null,
        notes:            notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/dossiers]', err)
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

    const { data, error } = await supabase
      .from('dossiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[PATCH /api/dossiers]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur interne' }, { status: 500 })
  }
}
