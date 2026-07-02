import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase } = await requireCompany()

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
    return apiError(err, '[GET /api/dossiers]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { client_nom, type_transaction, montant_pret, phase, notes } = await req.json()

    // Créer ou trouver le client
    let client_id: string | null = null
    if (client_nom?.trim()) {
      const { data: existing } = await supabase
        .from('clients').select('id').eq('company_id', companyId).ilike('nom', client_nom.trim()).limit(1).maybeSingle()

      if (existing) {
        client_id = existing.id
      } else {
        const { data: newClient } = await supabase
          .from('clients').insert({ company_id: companyId, nom: client_nom.trim() }).select('id').single()
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
        company_id:       companyId,
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
    return apiError(err, '[POST /api/dossiers]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('dossiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/dossiers]')
  }
}
