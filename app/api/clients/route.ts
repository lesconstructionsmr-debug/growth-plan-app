import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase } = await requireCompany()

    const { data, error } = await supabase
      .from('clients')
      .select('id, nom, email, telephone, ville, created_at')
      .order('nom', { ascending: true })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/clients]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const body = await req.json()
    const { nom, email, telephone, adresse, ville, province, code_postal, notes } = body

    if (!nom?.trim()) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_id: companyId,
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
    return apiError(err, '[POST /api/clients]')
  }
}
