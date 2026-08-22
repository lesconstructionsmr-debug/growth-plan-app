import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireCompany()
    const { searchParams } = new URL(req.url)

    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const search = searchParams.get('search')?.trim()

    let query = supabase
      .from('clients')
      .select('id, nom, email, telephone, ville, created_at')
      .order('nom', { ascending: true })

    if (search) {
      query = query.or(`nom.ilike.%${search}%,email.ilike.%${search}%,ville.ilike.%${search}%`)
    }

    if (limitParam !== null || offsetParam !== null) {
      const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 100)
      const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0)
      query = query.range(offset, offset + limit - 1)
    } else {
      // Rétrocompatibilité : plafond de sécurité à 100 lignes
      query = query.limit(100)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (err) {
    return apiError(err, '[GET /api/clients]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()

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
        province: province?.trim() || 'QC',
        code_postal: code_postal?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' },
    })
  } catch (err) {
    return apiError(err, '[POST /api/clients]')
  }
}
