import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { canUseAgenceMode } from '@/lib/platform-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase, user } = await requireAuth()

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.company_id) {
      return NextResponse.json({
        email: user.email ?? null,
        vertical: 'construction',
        agence_enabled: canUseAgenceMode(user.email),
        role: 'owner',
        full_name: null,
        name: 'Mon Entreprise',
      })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('name, vertical')
      .eq('id', profile.company_id)
      .single()

    const agenceEnabled = canUseAgenceMode(user.email)

    return NextResponse.json({
      email:           user.email        ?? null,
      name:            company?.name     ?? 'Mon Entreprise',
      vertical:        'construction',
      agence_enabled:  agenceEnabled,
      role:            profile.role      ?? 'owner',
      full_name:       profile.full_name ?? null,
    })
  } catch (err) {
    return apiError(err, '[GET /api/me]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId, user } = await requireCompanyAdmin()
    const { vertical } = await req.json()

    if (!vertical || !['construction', 'agence', 'courtier'].includes(vertical)) {
      return NextResponse.json({ error: 'Secteur invalide' }, { status: 400 })
    }

    const targetVertical = (vertical === 'courtier' || vertical === 'agence') ? 'agence' : 'construction'
    if (targetVertical === 'agence' && !canUseAgenceMode(user.email)) {
      return NextResponse.json({ error: 'Réservé à ton compte' }, { status: 403 })
    }

    const { error } = await supabase
      .from('companies')
      .update({ vertical: targetVertical })
      .eq('id', companyId)

    if (error) throw error

    return NextResponse.json({ success: true, vertical: targetVertical })
  } catch (err) {
    return apiError(err, '[POST /api/me]')
  }
}
